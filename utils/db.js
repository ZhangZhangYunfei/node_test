var DB = {};
module.exports = DB

DB.pool = require('mysql').createPool({
  host: '10.9.12.162',
  port: '3306',
  user: 'root',
  password: 'password',
  database: 'braavos',
  connectionLimit: 10
});

DB.connection = require('mysql').createConnection({
  host: '10.9.12.162',
  port: '3306',
  user: 'root',
  password: 'password',
  database: 'braavos'
});

