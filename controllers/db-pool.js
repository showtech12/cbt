const mysql = require('my-sql');

var pool;

function getPool () {
    if (pool) return pool;
    pool  = mysql.createPool({
        connectionLimit : 10,
        host            : process.env.DATABASE_HOST,
        user            : process.env.DATABASE_USER,
        password        : process.env.DATABASE_PASSWORD,
        database        : process.env.DATABASE_NAME
    });
    return pool;
}

module.exports = getPool();