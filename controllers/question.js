const pool = require('./db-pool');

module.exports.readQuestions = (req, res) => {
    let examId = Number(req.params.examId);
    if(!examId) return res.status(400).json({message: 'Malformed EXAMID. EXAMID should be integer.'});
    let limit  = req.query.limit? Number(req.query.limit)  : 1000;
    let offset = req.query.offset? Number(req.query.offset): 0;
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        connection.query(`
            SELECT * FROM questions
            WHERE examId = ?
            LIMIT ?, ?
        `, [examId, offset, limit], (err, questions, fields) => {
            if( err ) {
                console.log(err);
                return res. status(500).json({message: 'Something went wrong.'});
            }
            connection.query(`
                SELECT count(id) AS count FROM questions
                WHERE examId = ?
            `, examId, (err, questionCount, fields) => {
                let count = questionCount[0].count;
                if( err ) {
                    console.log(err);
                    return res.status(500).json({message: 'Something went wrong.'});
                }
                res.json({questions, count});
            });           
        });
        connection.release();
    })
        
};

module.exports.readQuestion = (req, res) => {
    let id = Number(req.params.id);
    let examId = Number(req.params.examId);
    if(!id || !examId) return res.status(400).json({message: 'Malformed ID. ID should be integer.'});
    pool.query(`
        SELECT * FROM questions
        WHERE id = ?
        AND examId = ?
    `, [id, examId], (err, result, fields) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result ) res.json(result);
        else res.status(404).json({message: 'Question doesn\'t exist.'});
    })
};

module.exports.createQuestion = (req, res) => {
    let question = req.body;
    let examId   = Number(req.params.examId);
    if(!examId) reject({status: 400, json:{message: 'Malformed EXAMID. EXAMID should be integer.'}});
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            connection.release();
            return reject({status: 500, json:{message: 'Something went wrong.'}});
        }
        createQuestion(connection, question, examId)
        .then(result => {
            res.json(result);
            connection.release();
        })
        .catch(err => {
            res.status(err.status).json(err.json);
            connection.release();
        })
    });
    
};

module.exports.updateQuestion = (req, res) => {
    let question = req.body;
    let examId   = Number(req.params.examId);
    let id   = Number(req.params.id);
    if(!examId || !id) return res.status(400).json({message: 'Malformed ID. ID should be integer.'});
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        connection.query(`
            SELECT examType FROM exams
            WHERE id = ?     
            `, examId, (err, result, fields) => {
            if(err) {
                console.log(err);
                return res.status(500).json({message: 'Something went wrong.'});
            }
            if(result[0].examType === 'objective' && (question.examType === 'objective' || !question.examType)) {
                 return res.status(400).json({message: 'Objective exam requires options in request body.'});
            }
            if(result[0].examType === 'theory' && (question.examType === 'theory' || !question.examType)) {
                if(question.options) return res.status(400).json({message: 'Theory exam does not require options in request body.'});
            }
            if(!question.options) question.options = null;
            question.examId = examId;
            if(question.options) {
                try {
                    question.options = JSON.stringify(question.options);
                } catch(err) {
                    console.log(err);
                    return res.status(400).json({message: 'Invalid structure for options in request body.'});
                }
            }
            if(question.answers) {
                try {
                    question.answers = JSON.stringify(question.answers);
                } catch(err) {
                    console.log(err);
                    return res.status(400).json({message: 'Invalid structure for answers in request body.'});
                }
            }            
            connection.query(`
                UPDATE questions SET ?
                `, question, (err, result) => {
                if(err) {
                    console.log(err);
                    return res.status(500).json({message: 'Something went wrong.'})
                }
                if(result.changedRows === 0) {
                    return res.status(400).json({message: 'No changes detected or question not found,.'})
                }
                res.json({message: 'Updated Question ' + id});
            });            
        });
        connection.release();
    });
};

module.exports.deleteQuestion = (req, res) => {
    let id     = Number(req.params.id);
    let examId = Number(req.params.examId);
    if(!id || !examId) return res.status(400).json({message: 'Malformed ID. ID should be integer.'});
    pool.query(`
        DELETE FROM questions
        WHERE id = ?
        AND examId = ?
    `, [id, examId], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if(result.affectedRows === 0) {
            return res.status(400).json({message: 'Question not found.'})
        }
        res.json({message: 'deleted question ' + id});
    });
};

module.exports.deleteQuestions = (req, res) => {
    let examId = Number(req.params.examId);
    if(!examId) return res.status(400).json({message: 'Malformed exam ID. Exam ID should be integer.'});
    pool.query(`
        DELETE FROM questions
        WHERE examId = ?;
    `, examId, (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        res.json({message: 'Deleted all questions from exam ' + examId});
    });
};

module.exports.createQuestions = (req, res) => {
    const failed = [], succs = [];
    let examId   = Number(req.params.examId);
    if(!examId) return res.status(400).json({message: 'Malformed EXAMID. EXAMID should be integer.'});
    let questions = req.body.questions;
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            connection.release();
            return res.status(500).json({message: 'Something went wrong.'});

        }
        for(let i = 0, p = Promise.resolve(); i < questions.length; i++) {
            p = p.then(_ => new Promise(resolve => {
                let thisQuestion = questions[i];
                createQuestion(connection, thisQuestion, examId)
                .then(result => {
                    succs.push(thisQuestion);
                    if(i === questions.length - 1) {
                        connection.release();
                        res.json({message: 'Batch operation complete.', success: succs.length, failures: failed.length, failed})
                    }
                    resolve();
                })
                .catch(err => {
                    failed.push(thisQuestion);
                    if(i === questions.length - 1) {
                        connection.release();
                        res.json({message: 'Batch operation complete.', success: succs.length, failures: failed.length, failed})
                    }
                    resolve();
                });
            }));            
        }
    });
}

function createQuestion(connection, question, examId) {
    return new Promise((resolve, reject) => {
        connection.query(`
            SELECT examType FROM exams
            WHERE id = ?     
            `, examId, (err, result, fields) => {
            if(err) {
                console.log(err);
                return reject({status: 500, json:{message: 'Something went wrong.'}});
            }
            if(result[0].examType === 'objective' && !question.options) {
                return reject({status: 500, json:{message: 'Objective exam require options in request body.'}});
            }
            if(result[0].examType === 'theory' && question.options) {
                return reject({status: 400, json:{message: 'Theory exam does not require options in request body.'}});
            }
            if(!question.options) question.options = null;
            question.examId = examId;
            try {
                question.options = JSON.stringify(question.options);
                question.answers = JSON.stringify(question.answers);
            } catch(err) {
                console.log(err);
                connection.release();
                return reject({status: 400, json:{message: 'Invalid structure for options or answers in request body.'}});
            }
            connection.query(`
                INSERT INTO questions SET ?
                `, question, (err, result) => {
                if(err) {
                    console.log(err);
                    return reject({status: 500, json:{message: 'Something went wrong.'}});
                }
                return resolve({message: 'created Question ' + result.insertId});
            });            
        });
    });
}