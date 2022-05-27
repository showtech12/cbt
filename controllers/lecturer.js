const pool = require('./db-pool');

module.exports.readLecturers = (req, res) => {
    let examId = Number(req.params.examId);
    if(!examId) return res.status(400).json({message: 'Malformed EXAMID. EXAMID should be integer.'});
    pool.query(`
        SELECT * FROM lecturers
        WHERE examId = ?
    `, examId, (err, lecturers, fields) => {
        if( err ) {
            console.log(err);
            return res. status(500).json({message: 'Something went wrong.'});
        }
        res.json({lecturers, count: lecturers.length});
    });
        
};

module.exports.readLecturer = (req, res) => {
    let examId = Number(req.params.examId);
    let id     = Number(req.params.id);
    if(!examId || !id) return res.status(400).json({message: 'Malformed ID. exam or lecturer ID should be integer'});
    pool.query(`
        SELECT * FROM lecturers
        WHERE examId = ?
        AND id = ?
    `, [examId, id], (err, result, fields) => {
        if( err ) {
            console.log(err);
            return res. status(500).json({message: 'Something went wrong.'});
        }
        let lecturer = result[0]
        if(lecturer) res.json(lecturer);
        else res.status(404).json({message: 'Lecturer doesn\'t exist.'})
    })
};

module.exports.createLecturer = (req, res) => {
    let lecturer = req.body;
    let examId   = Number(req.params.examId);
    if(!examId) res.status(400).json({message: 'Malformed EXAMID. EXAMID should be integer.'});
    lecturer.examId = examId;
    if(!lecturer.password) {
        let chars = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890';
        let password = '';
        for(let i = 0; i < 6; i++) {
            password += chars[Math.floor(Math.random() * (chars.length - 1))];
        }
        lecturer.password = password;
    }
    pool.query(`
        INSERT INTO lecturers SET ?
        `, lecturer, (err, result) => {
        if(err) {
            if(err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({message: 'Lecturer with given email or ID already exists'});
            }
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        res.json({message: 'created lecturer ' + result.insertId});
    });
}

module.exports.updateLecturer = (req, res) => {
    let lecturer = req.body;
    let examId   = Number(req.params.examId);
    let id   = req.params.id;
    if(!examId) return res.status(400).json({message: 'Malformed exam ID. ID should be integer.'});
    lecturer.examId = examId
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }         
        connection.query(`
            UPDATE lecturers
            SET ?
            WHERE id = ?
            `, [lecturer, id], (err, result) => {
            if( err ) {
                console.log(err); 
                return res.status(500).json({message: 'Something went wrong.'})
            }
            if(result.changedRows === 0) {  
                return res.status(400).json({message: 'No changes detected or lecturer not found.'})
            }
            res.json({message: 'Updated lecturer ' + id});
        });        
        connection.release();    
    });
};

module.exports.deleteLecturer = (req, res) => {
    let id     = req.params.id;
    let examId = Number(req.params.examId);
    if(!examId || !id) return res.status(400).json({message: 'Malformed ID. exam and lecturer ID should be integer.'});
    pool.query(`
        DELETE FROM lecturers
        WHERE id = ?
        AND examId = ?
    `, [id, examId], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if(result.affectedRows === 0) {
            return res.status(400).json({message: 'Lecturer not found.'})
        }
        res.json({message: 'deleted lecturer ' + id});
    });
};
