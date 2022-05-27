const pool = require('./db-pool');
const fetch = require('node-fetch');
const crypto = require("crypto");

module.exports.logStudentIn = (req, res) => {
    const student = req.body;
    if(!student.regNo || !student.password) return res.status(400).json({message: 'Student regNo and password required.'});
    if(!student.examId) return res.status(400).json({message: 'Exam ID is required.'});
    pool.query(`
        SELECT * FROM students
        WHERE regNo = ?
        AND password = ?
    `, [student.regNo, student.password], (err, result) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result.length < 1 ) return res.status(401).json({message: 'Incorrect credentials.'});
        let fetchedStudent = result.find(stu => stu.examId === student.examId);
        if( !fetchedStudent ) return res.status(401).json({message: 'Student not registered for exam.'});
        let session = createSession('student', student.regNo, student.examId);
        pool.query(`
            INSERT INTO sessions
            SET ?
        `, session, (err, result) => {
            if( err ) {
                console.log(err);
                return res. status(500).json({message: 'Something went wrong.'});
            }
            res.setHeader('SID', session.id);
            fetch(`${req.protocol}://${req.headers.host}/exams/${student.examId}`, {headers: {sid: session.id}}).then(resp => resp.json())
            .then(data => {res.json(data)});
        })
        
    });
}

module.exports.logAdminIn = (req, res) => {
    const admin = req.body;
    if(!admin.email || !admin.password) return res.status(400).json({message: 'Admin email and password required.'});
    let email = process.env.ADMIN_EMAIL
    let password = process.env.ADMIN_PASSWORD
    if( email !== admin.email || password !== admin.password ) return res.status(401).json({message: 'Incorrect credentials.'});
    let session = createSession('admin', admin.email);
    pool.query(`
        INSERT INTO sessions
        SET ?
    `, session, (err, result) => {
        if( err ) {
            console.log(err);
            return res. status(500).json({message: 'Something went wrong.'});
        }
        res.setHeader('SID', session.id);
        res.json({message: 'Logged in.'});
    })
}

module.exports.logLecturerIn = (req, res) => {
    const lecturer = req.body;
    if(!lecturer.email || !lecturer.password) return res.status(400).json({message: 'Lecturer email and password required.'});
    pool.query(`
        SELECT * FROM lecturers
        WHERE email = ?
        AND password = ?
    `, [lecturer.email, lecturer.password], (err, result) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result.length < 1 ) return res.status(401).json({message: 'Incorrect credentials.'});
        let fetchedLecturer = result[0];
        let session = createSession('lecturer', lecturer.email, lecturer.examId);
        pool.query(`
            INSERT INTO sessions
            SET ?
        `, session, (err, result) => {
            if( err ) {
                console.log(err);
                return res. status(500).json({message: 'Something went wrong.'});
            }
            res.setHeader('SID', session.id);
            res.json({message: 'Logged in.'});
        });        
    });
}

module.exports.logout = (req, res) => {
    let sid = req.headers.sid;
    pool.query(`
        DELETE FROM sessions
        WHERE id = ?
    `, sid, (err, result) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        res.json({message: 'Logged out.'});
    })    
}

function createSession(privilege, userId, examId = null) {
    let uuid = crypto.randomBytes(16).toString("hex") + (new Date()).getTime().toString(16);
    let session = {
        privilege,
        id: uuid,
        userId,
        examId
    };
    return session;
}