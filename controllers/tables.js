const pool = require('./db-pool');

module.exports = () => {
    pool.getConnection(function(err, connection) {
        if(err) throw err;
        connection.query(`CREATE TABLE IF NOT EXISTS exams(
            id INT NOT NULL AUTO_INCREMENT,
            date DATETIME DEFAULT CURRENT_TIMESTAMP(),
            tutor VARCHAR(255),
            courseTitle VARCHAR(255) NOT NULL UNIQUE,
            creditLoad INT,
            courseCode VARCHAR(255),
            examDuration INT,
            examInstructions JSON,
            examType ENUM('objective', 'theory') NOT NULL,
            PRIMARY KEY(id)
        )`, (err, result) => {
            if(err) console.log(err);
            else console.log('Exams table created')
        });

        connection.query(`
            CREATE TABLE IF NOT EXISTS questions(
                id INT NOT NULL AUTO_INCREMENT,
                question VARCHAR(1000),
                options JSON,
                answers JSON,
                examId INT NOT NULL,
                PRIMARY KEY(id),
                FOREIGN KEY(examId) REFERENCES exams(id)
            )`, (err, result) => {
            if(err) console.log(err);
            else console.log('Questions table created')
        });

        connection.query(`
            CREATE TABLE IF NOT EXISTS batches(
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(255),
                examId INT,
                active BOOLEAN,
                PRIMARY KEY(id),
                FOREIGN KEY(examId) REFERENCES exams(id)
            )`, (err, result) => {
            if(err) console.log(err);
            else console.log('Batches table created')
        });

        connection.query(`
            CREATE TABLE IF NOT EXISTS students(
                id INT NOT NULL AUTO_INCREMENT,
                regNo VARCHAR(255) UNIQUE,
                name VARCHAR(255) NOT NULL,
                password VARCHAR(255),
                department VARCHAR(255),
                examId INT NOT NULL,
                batchId INT,
                hall VARCHAR(255),
                PRIMARY KEY(id),
                FOREIGN KEY(examId) REFERENCES exams(id),
                FOREIGN KEY(batchId) REFERENCES batches(id)
            )`, (err, result) => {
            if(err) console.log(err);
            else console.log('Students table created')
        });

        connection.query(`
            CREATE TABLE IF NOT EXISTS lecturers(
                id INT NOT NULL AUTO_INCREMENT,
                name VARCHAR(255),
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                examId INT NOT NULL,
                PRIMARY KEY(id),
                FOREIGN KEY(examID) REFERENCES exams(id)
            )`, (err, result) => {
            if(err) console.log(err);
            else console.log('Lecturers table created')
        })

        connection.query(`
            CREATE TABLE IF NOT EXISTS results(
                id INT NOT NULL AUTO_INCREMENT,
                regNo VARCHAR(255) UNIQUE,
                name VARCHAR(255),
                summary JSON,
                examId INT NOT NULL,
                score INT,
                grade TINYTEXT,
                PRIMARY KEY(id),
                FOREIGN KEY(examID) REFERENCES exams(id)
            )`, (err, result) => {
            if(err) console.log(err);
            else console.log('Results table created')
        })

        connection.query(`
            CREATE TABLE IF NOT EXISTS sessions(
                id VARCHAR(255) UNIQUE,
                userId VARCHAR(255),
                examId INT,
                privilege VARCHAR(255),
                PRIMARY KEY(id)
            )`, (err, result) => {
            if(err) console.log(err);
            else console.log('Sessions table created')
        })
        connection.release();
    });
}