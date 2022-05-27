const pool = require('../controllers/db-pool');
let middleware = {};

middleware.isStudent = (req, res, next) => {
    let sid = req.headers.sid;
    if( !sid ) return res.status(401).json({message: 'Not logged In.'});
    pool.query(`
        SELECT * FROM sessions
        WHERE id = ?
    `, sid, (err, result) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result.length < 1 ) return res.status(401).json({message: 'Not logged In.'});
        let session = result[0];
        if( session.privilege !== 'student') return res.status(403).json({message: 'Unauthorized request'})
        next();
    })
}

middleware.isAdmin = (req, res, next) => {
    let sid = req.headers.sid;
    if( !sid ) return res.status(401).json({message: 'Not logged In.'});
    pool.query(`
        SELECT * FROM sessions
        WHERE id = ?
    `, sid, (err, result) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result.length < 1 ) return res.status(401).json({message: 'Not logged In.'});
        let session = result[0];
        if( session.privilege !== 'admin') return res.status(403).json({message: 'Unauthorized request'})
        next();
    })
}

middleware.isAdminOrLecturer = (req, res, next) => {
    let examId   = Number(req.params.examId);
    if(!examId) res.status(400).json({message: 'Malformed EXAMID. EXAMID should be integer.'});
    let sid = req.headers.sid;
    if( !sid ) return res.status(401).json({message: 'Not logged In.'});
    pool.query(`
        SELECT * FROM sessions
        WHERE id = ?
    `, sid, (err, result) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result.length < 1 ) return res.status(401).json({message: 'Not logged In.'});
        let session = result[0];
        if( session.privilege === 'admin' || (session.privilege === 'lecturer' && session.examId === examId )) 
        {return next();}
        res.status(403).json({message: 'Unauthorized request'});
    });
}

middleware.isAdminOrSpecificLecturer = (req, res, next) => {
    let examId   = Number(req.params.examId);
    let id   = Number(req.params.id);
    if(!examId) res.status(400).json({message: 'Malformed EXAMID. EXAMID should be integer.'});
    let sid = req.headers.sid;
    if( !sid ) return res.status(401).json({message: 'Not logged In.'});
    pool.query(`
        SELECT * FROM sessions
        WHERE id = ?
    `, sid, (err, result) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result.length < 1 ) return res.status(401).json({message: 'Not logged In.'});
        let session = result[0];
        if( session.privilege === 'admin' || (session.privilege === 'lecturer' && session.examId === examId && session.userId === id ))
        {return next();}
        res.status(403).json({message: 'Unauthorized request'});
    });
}

middleware.isLoggedIn = (req, res, next) => {
    let sid = req.headers.sid;
    if( !sid ) return res.status(401).json({message: 'Not logged In.'});
    pool.query(`
        SELECT * FROM sessions
        WHERE id = ?
    `, sid, (err, result) => {
        if( err ) {
            console.log(err);
            return res.status(500).json({message: 'Something went wrong.'});
        }
        if( result.length < 1 ) return res.status(401).json({message: 'Not logged In.'});
        next();
    });
}

module.exports = middleware;