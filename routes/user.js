var express = require('express');
var router = express.Router();
var DB = require('../utils/db');


router.get('/', function (req, res) {
  var user;
  if (req.session.type === 'teacher') {
    //todo query db
    user = {
      name: req.session.name,
      subject: '数学',
      telephone: '13917043650'
    }
  } else {
    //todo query db
    user = {
      name: req.session.name,
      school: '香山中学',
      telephone: '13917043650'
    }
  }
  res.status(200).end(JSON.stringify(user));
});

router.post('/login', function (req, res) {
  if (req.body.name && req.body.password && req.body.type) {
    var value;
    var sql;
    if (req.body.type === 'teacher') {
      sql = 'select * from teacher where username = ?'
    } else {
      sql = 'select * from student where username = ?'
    }

    try {
      DB.connection.connect();
      DB.connection.query(sql, [req.body.username], function (error, results, fields) {
        if (error) {
          throw error;
        }
      })
    } finally {
      DB.connection.end();
    }

    // DB.pool.getConnection(function (err, connection) {
    //   connection.query({
    //     sql: sql,
    //     values: [req.body.username]
    //   }, function (error, results, fields) {
    //     if (error) {
    //       throw error;
    //     }
    //   })
    // });
    var session = {
      id: 0,
      username: req.body.username,
      realname: '',
      type: req.body.type,
      signed: true
    };
    req.session = session;
    res.status(200).end(JSON.stringify(session));
  } else {
    res.status(301).end(JSON.stringify({signed: false}))
  }
});

router.post('/logout', function (req, res) {
  req.session = null;
  res.status(200).end(JSON.stringify({status: 'SUCCEED'}));
});

router.post('/register', function (req, res) {
  //todo only a sample: should consider conflict...
  if (req.body.username && req.body.password && req.body.type) {
    var value;
    var sql;
    if (req.body.type === 'teacher') {
      sql = 'insert into teacher set ?';
      value = {
        username: req.body.username,
        realname: req.body.realName,
        subject: req.body.subject,
        password_hash: req.body.password,
        salt: '1',
        address: req.body.address || '',
        telephone: req.body.telephone || '',
        created_time: new Date(),
        updated_time: new Date()
      };
    } else {
      sql = 'insert into student set ?';
      value = {
        username: req.body.username,
        realname: req.body.realName,
        school: req.body.school,
        degree: req.body.degree,
        password_hash: req.body.password,
        salt: '1',
        address: req.body.address || '',
        telephone: req.body.telephone || '',
        created_time: new Date(),
        updated_time: new Date()
      };
    }
    try {
      DB.connection.connect();
      DB.connection.query(sql, value, function (error, results, fields) {
        if (error) {
          throw error;
        }
      })
    } finally {
      DB.connection.end();
    }

    // DB.pool.getConnection(function (err, connection) {
    //   if (err) {
    //     throw err;
    //   }
    //   connection.query(sql, value, function (error, results, fields) {
    //     // And done with the connection.
    //     connection.release();
    //     // Handle error after the release.
    //     if (error) {
    //       throw error;
    //     }
    //   })
    // });
    res.status(201).end(JSON.stringify({status: 'SUCCEED'}));
  } else {
    res.status(500).end(
      JSON.stringify({
        status: 'FAILED',
        message: '姓名密码或者注册类型参数校验错误'
      }))
  }
});

module.exports = router;
