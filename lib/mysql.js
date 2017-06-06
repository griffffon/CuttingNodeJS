/**
 * Created by gzelinskiy on 06.06.17.
 */
var mysql = require('mysql');

var connection = mysql.createConnection({
    host    : 'localhost',
    user    : 'root',
    password: 'a3llwOlt',
    database: 'cutting',
    charset : 'utf8mb4_general_ci'
});

exports.connection = connection;