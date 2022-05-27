const pool    = require('./db-pool');
const request = require('axios').create({
    baseURL: process.env.AI_API,
    timeout: 5000,
    headers: {'Content-Type': 'application/json'}
  });

module.exports.readResults = (req, res) => {
    let examId = Number(req.params.examId);
    if(!examId) return res.status(400).json({message: 'Malformed EXAMID. EXAMID should be integer.'});
    let limit  = req.query.limit? Number(req.query.limit)   : 1000;
    let offset = req.query.offset? Number(req.query.offset) : 0;
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        connection.query(`
            SELECT * FROM results
            WHERE examId = ?
            LIMIT ?, ?
        `, [examId, offset, limit], (err, results, fields) => {
            if( err ) {
                console.log(err);
                return res. status(500).json({message: 'Something went wrong.'});
            }
            connection.query(`
                SELECT count(id) AS count FROM results
                WHERE examId = ?
            `, examId, (err, resultCount, fields) => {
                let count = resultCount[0].count;
                if( err ) {
                    console.log(err);
                    return res.status(500).json({message: 'Something went wrong.'});
                }
                res.json({results, count});
            });
        });
    })
   
        
};

module.exports.readResult = (req, res) => {
    let regNo = req.params.id;
    let examId = Number(req.params.examId);
    if(!regNo || !examId) return res.status(400).json({message: 'Malformed ID. ID should be integer.'});
    pool.query(`
        SELECT * FROM results
        WHERE regNo = ?
        AND examId = ?
    `, [regNo, examId], (err, result, fields) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result[0] ) res.json(result[0]);
        else res.status(404).json({message: 'Student or exam doesn\'t exist.'});
    })
};

module.exports.createResult = (req, res) => {
    let result = req.body;
    if(Object.keys(result).length === 0) {
        return res.status(400).json({message: 'Request body required.'})
    }
    let regNo = req.body.regNo;
    let examId   = Number(req.params.examId);
    if(!examId) reject({status: 400, json:{message: 'Malformed EXAMID. EXAMID should be integer.'}});
    if(!regNo) reject({status: 400, json:{message: 'Reg number is required in request body.'}});
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            connection.release();
            return reject({status: 500, json:{message: 'Something went wrong, Please try again.'}});
        }
        //check if already submitted
        connection.query(`
            SELECT count(id) AS count FROM results
            WHERE examId = ?
            AND regNo = ?
        `, [examId, regNo], (err, resultCount, fields) => {
            let count = resultCount[0].count;
            if(err) {
                console.log(err);
                return res.status(500).json({message: 'Something went wrong.'});
            }
            if( count > 0 ) {
                return res.status(409).json({message: 'Response already submitted'});
            }
            //check the exam type
            connection.query(`
                SELECT examType FROM exams
                WHERE id = ?
            `, examId, (err, response, fields) => {
                if(err) {
                    console.log(err);
                    return res.status(500).json({message: 'Something went wrong.'});
                }
                let examType = response[0].examType;
                connection.query(`
                    SELECT id, question, answers FROM questions
                    WHERE examId = ?
                `, examId, (err, questions, fields) => {
                    if( err ) {
                        console.log(err);
                        return res.status(500).json({message: 'Something went wrong.'});
                    }
                    if(questions.length < result.responses.length) {
                        return res.status(400).json({message: 'Questions don\'t match with those in database.'});
                    }
                    if( examType === 'theory' ) {
                        let reqData = [];                    
                        result.responses.forEach(response => {
                            response.solution = response.response;
                            delete response.response;
                            let responseId    = response.id;
                            let matchedQuestionIndex = questions.findIndex(e => e.id === responseId);
                            let thisQuestion = { ...response, ...questions[matchedQuestionIndex] };
                            thisQuestion.answers = JSON.parse(thisQuestion.answers);
                            reqData.push(thisQuestion);
                        });
                        if(reqData.length < 1) {
                            return res.status(400).json({message: 'Questions don\'t match with those in database.'});
                        }
                        let reqBody = {questions: reqData}
                        console.log(reqBody)
                        request.post('/score', reqBody)
                        .then(response => {
                            console.log(response.data);
                            let score = Math.ceil(((response.data.score / 2) / result.responses.length) * 100);
                            let grade = getGrade(score);
                            let dbResult = {regNo, score, grade, examId, summary: response.data.questions}
                            saveResult(dbResult, connection, res);
                        })
                        .catch(err => {
                            console.log(err.message);
                            res.status(500).json({message: 'Something went wrong.'})
                        });
                        
                    } else if( examType === 'objective' ) {
                        let correct = 0;
                        let summary = [];
                        result.responses.forEach(response => {
                            let responseId    = response.id;
                            let matchedQuestionIndex = questions.findIndex(e => e.id === responseId);
                            if( response.response === questions[matchedQuestionIndex].answers[0]) {
                                correct++;
                                summary.push({id: responseId, isCorrect: true})
                            } else {
                                summary.push({id: responseId, isCorrect: false})
                            }
                        });
                        let score = Math.ceil((correct / result.responses.length) * 100);
                        let grade = getGrade(score);
                        let dbResult = {regNo, score, grade, examId}
                        saveResult(dbResult, connection, res);
                    }
                });
            });
        });
    });  
};

function saveResult(result, connection, res) {
    connection.query(`
        SELECT name FROM students
        WHERE regNo = ?
    `, result.regNo, (err, student, fields) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        let studentName = student[0].name;
        result.name = studentName;
        result.summary = JSON.stringify(result.summary);
        connection.query(`
            INSERT INTO results
            SET ?
        `, result, (err, response, fields) => {
            if( err ) {
                console.log(err);
                return res.status(500).json({message: 'Something went wrong.'});
            }
            res.json({message: 'Response submitted.', score: result.score})
        })
    })
    
}

function getGrade(score) {
    let grade = score < 40 ? 'F' : 
    (score < 45 ? 'E' : 
    (score < 50 ? 'D' : 
    (score < 60 ? 'C' : 
    (score < 70 ? 'B' : 'A'))))
    return grade;
}