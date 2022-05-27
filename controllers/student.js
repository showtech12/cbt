const pool = require('./db-pool');

module.exports.readStudents = (req, res) => {
    let examId = Number(req.params.examId);
    if(!examId) return res.status(400).json({message: 'Malformed EXAMID. EXAMID should be integer.'});
    let limit  = req.query.limit? Number(req.query.limit)  : 1000;
    let offset = req.query.offset? Number(req.query.offset): 0;
    let hall = req.query.hall? req.query.hall: '%';
    let batch = req.query.batch? req.query.batch: null;
    let batchId = batch? Number(batch): null;
    let department = req.query.department? req.query.department: '%';
    let batchQuery = '';
    pool.getConnection((err, connection) => {
        if(batch) {
            if(batchId) {
                batchQuery = 'AND batchId = ' + batchId;
            } else {
                return res.status(400).json({message: 'Malformed batch in query. batch should be integer.'})
            }
        }
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        connection.query(`
            SELECT * FROM students
            WHERE examId = ?
            ${batchQuery}
            AND hall LIKE ?
            AND department LIKE ?
            LIMIT ?, ?
        `, [examId, hall, department, offset, limit], (err, students, fields) => {
            if( err ) {
                console.log(err);
                return res. status(500).json({message: 'Something went wrong.'});
            }
            connection.query(`
                SELECT count(id) AS count FROM students
                WHERE examId = ?
                AND hall LIKE ?
                ${batchQuery}
                AND department LIKE ?
            `, [examId, hall, department], (err, studentCount, fields) => {
                let count = studentCount[0].count;
                if( err ) {
                    console.log(err);
                    return res.status(500).json({message: 'Something went wrong.'});
                }
                res.json({students, count});
            });           
        });
        connection.release();
    })
        
};

module.exports.readStudent = (req, res) => {
    let regNo = req.params.id;
    let examId = Number(req.params.examId);
    if(!regNo || !examId) return res.status(400).json({message: 'Malformed ID. ID should be integer.'});
    pool.query(`
        SELECT * FROM students
        WHERE regNo = ?
        AND examId = ?
    `, [regNo, examId], (err, result, fields) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result[0] ) res.json(result[0]);
        else res.status(404).json({message: 'Student doesn\'t exist.'});
    })
};

module.exports.createStudent = (req, res) => {
    let student = req.body;
    let examId   = Number(req.params.examId);
    if(!examId) reject({status: 400, json:{message: 'Malformed EXAMID. EXAMID should be integer.'}});
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            connection.release();
            return reject({status: 500, json:{message: 'Something went wrong.'}});
        }
        createStudent(connection, student, examId)
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

module.exports.updateStudent = (req, res) => {
    let student = req.body;
    let examId   = Number(req.params.examId);
    let regNo   = req.params.id;
    if(!examId) return res.status(400).json({message: 'Malformed exam ID. ID should be integer.'});
    student.examId = examId
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }         
        connection.query(`
            UPDATE students
            SET ?
            WHERE regNo = ?
            `, [student, regNo], (err, result) => {
            if(err) {
                console.log(err);
                return res.status(500).json({message: 'Something went wrong.'})
            }
            if(result.changedRows === 0) {
                return res.status(400).json({message: 'No changes detected or student not found.'})
            }
            res.json({message: 'Updated student ' + regNo});
        });        
        connection.release();    
    });
};

module.exports.deleteStudent = (req, res) => {
    let regNo     = req.params.id;
    let examId = Number(req.params.examId);
    if(!examId) return res.status(400).json({message: 'Malformed exam ID. ID should be integer.'});
    pool.query(`
        DELETE FROM students
        WHERE regNo = ?
        AND examId = ?
    `, [regNo, examId], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if(result.affectedRows === 0) {
            return res.status(400).json({message: 'Student not found.'})
        }
        res.json({message: 'deleted student ' + regNo});
    });
};

module.exports.deleteStudents = (req, res) => {
    let examId = Number(req.params.examId);
    if(!examId) return res.status(400).json({message: 'Malformed exam ID. Exam ID should be integer.'});
    pool.query(`
        DELETE FROM students
        WHERE examId = ?;
    `, examId, (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        res.json({message: 'Deleted all students from exam ' + examId});
    });
};

module.exports.createStudents = (req, res) => {
    const failed = [], succs = [];
    let examId   = Number(req.params.examId);
    if(!examId) return res.status(400).json({message: 'Malformed EXAMID. EXAMID should be integer.'});
    let students = req.body.students;
    if(!students) return res.status(400).json({message: 'Student is undefined, check request body.'});
    pool.getConnection((err, connection) => {
        if( err ) {
            console.log(err);
            connection.release();
            return res.status(500).json({message: 'Something went wrong.'});
        }
        for(let i = 0, p = Promise.resolve(); i < students.length; i++) {
            p = p.then(_ => new Promise(resolve => {
                let thisStudent = students[i];
                createStudent(connection, thisStudent, examId)
                .then(result => {
                    succs.push(thisStudent);
                    if(i === students.length - 1) {
                        connection.release();
                        res.json({message: 'Batch operation complete.', success: succs.length, failures: failed.length, failed})
                    }
                    resolve();
                })
                .catch(err => {
                    failed.push(thisStudent);
                    if(i === students.length - 1) {
                        connection.release();
                        res.json({message: 'Batch operation complete.', success: succs.length, failures: failed.length, failed})
                    }
                    resolve();
                });
            }));            
        }
    });
}

function createStudent(connection, student, examId) {
    student.examId = examId;
    if(student.id) delete student.id;
    let chars = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890';
    let password = '';
    for(let i = 0; i < 6; i++) {
        password += chars[Math.floor(Math.random() * (chars.length - 1))];
    }
    student.password = password;
    return new Promise((resolve, reject) => {
        connection.query(`
            INSERT INTO students SET ?
            `, student, (err, result) => {
            if(err) {
                if(err.code === 'ER_DUP_ENTRY') {
                    return reject({status: 400, json:{message: 'Student with reg number ' + student.regNo + ' already exists'}});
                }
                console.log(err);
                return reject({status: 500, json:{message: 'Something went wrong.'}});
            }
            return resolve({message: 'created student ' + student.regNo});
        });
    });
}