const pool = require('./db-pool');

module.exports.readExams = (req, res) => {
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        connection.query(`
            SELECT * FROM exams;    
        `, (err, exams, fields) => {
            if(err) {
                console.log(err);
                return res.status(500).json({message: 'Something went wrong.'});
            }
            connection.query(`
                SELECT count(id) AS count FROM exams;
            `, (err, examCount, fields) => {
                let count = examCount[0].count;
                if(err) {
                    console.log(err);
                    return res.status(500).json({message: 'Something went wrong.'});
                }
                res.json({exams, count});
            })           
        });
        connection.release();
    })
        
};

module.exports.readExam = (req, res) => {
    let id = Number(req.params.id);
    if(!id) return res.status(400).json({message: 'Malformed ID. ID should be integer.'})
    pool.query(`
        SELECT * FROM exams
        WHERE id = ?
    `, [id], (err, result, fields) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result ) res.json(result);
        else res.status(404).json({message: 'Exam doesn\'t exist.'});
    })
};

module.exports.createExam = (req, res) => {
    let exam = req.body;
    try{
        exam.examInstructions = JSON.stringify(exam.examInstructions);
    } catch(err) {
        console.log(err);
        return res.status(400).json({message: 'Invalid structure for examInstructions.'});
    }
    if(!exam.courseTitle || !exam.examType) {
        return res.status(400).json({message: 'Invalid request body, courseTitle and examType are required fields'});
    }
    pool.query(`
        INSERT INTO exams SET ?        
    `, exam, (err, result, fields) => {
        if(err) {
            console.log(err);
            if(err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({message: 'Course with given course title already exists.'});
            }
            return res.status(500).json({message: 'Something went wrong.'});
        }
        res.json({message: 'created exam ' + result.insertId});
    });
};

module.exports.updateExam = (req, res) => {
    let update = req.body;
    let id = Number(req.params.id);
    if(!id) return res.status(400).json({message: 'Malformed ID. ID should be integer.'});
    pool.query(`
        UPDATE exams SET ?
        WHERE id = ?
    `, [update, id], (err, result, fields) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        console.log(result)
        res.json({message: 'updated exam ' + id});
    });
};

module.exports.deleteExam = (req, res) => {
    let id = Number(req.params.id);
    if(!id) return res.status(400).json({message: 'Malformed ID. ID should be integer.'});
    pool.query(`
        DELETE FROM exams
        WHERE id = ?
    `, id, (err, result, fields) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        res.json({message: 'deleted exam ' + id});
    });
};

module.exports.deleteExams = (req, res) => {
    pool.query(`
        DROP TABLE exams;
    `, (err, result, fields) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        require('./tables')();
        res.json({message: 'deleted all exams'});
    });
};