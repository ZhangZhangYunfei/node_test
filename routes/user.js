let express = require('express');
let router = express.Router();
let DB = require('../utils/db');
let Json = require('../utils/json');
let log = require('../utils/log');

router.get('/', function (req, res) {
  let sql;
  if (req.session.type === 'teacher') {
    sql = 'select * from teacher where id = ?'
  } else {
    sql = 'select * from student where id = ?'
  }

  DB.query(sql, [req.session.userId])
    .then(results => {
      res.status(200).end(Json.toString(results[0]));
    })
    .catch(err => {
      log.info(Json.toString(err));
      res.end(Json.toString({status: 'FAILED', message: err ? err.message : '不存在此用户！'}))
    });
});

router.post('/login', function (req, res) {
  if (req.body.telephone && req.body.password && req.body.type) {
    let sql;
    if (req.body.type === 'teacher') {
      sql = 'select * from teacher where telephone = ?'
    } else {
      sql = 'select * from student where telephone = ?'
    }

    DB.query(sql, [req.body.telephone])
      .then(results => {
        switch (true) {
          case results[0].password_hash !== req.body.password:
            res.end(Json.toString({status: 'FAILED', message: '密码不正确！'}));
            break;
          default:
            req.session = {
              userId: results[0].id,
              name: results[0].name,
              type: req.body.type
            };
            res.end(Json.toString({status: 'SUCCESS', message: '登陆成功！'}));
        }
      })
      .catch(err => {
        log.info(Json.toString(err));
        res.end(Json.toString({status: 'FAILED', message: err ? err.message : '不存在此用户！'}));
      });
  } else {
    res.end(Json.toString({status: 'FAILED', message: '登录参数不全！'}))
  }
});

router.post('/logout', function (req, res) {
  req.session = null;
  res.status(200).end(Json.toString({status: 'SUCCEED'}));
});

router.post('/password-resets', function (req, res) {
  if (req.body.oldPassword && req.body.newPassword) {
    let sql = req.session.type === 'teacher'
      ? 'select * from teacher where id = ?'
      : 'select * from student where id = ?';
    let updateSql = req.session.type === 'teacher'
      ? 'update teacher set password_hash = ? where id = ? and password_hash = ?'
      : 'update student set password_hash = ? where id = ? and password_hash = ?';

    DB.query(sql, [req.session.userId])
      .then(results => {
        if (results[0].password_hash === req.body.oldPassword) {
          return DB.query(updateSql,
            [req.body.newPassword, req.session.userId, req.body.oldPassword],
            results => {
              return results.affectedRows === 1
            })
        } else {
          return Promise(function (resolve, reject) {
            setTimeout(function () {
              reject(new Error('旧密码不正确！'));
            }, 0)
          });
        }
      })
      .then(results => {
        res.end(Json.toString({status: 'SUCCESS', message: '更新成功!'}));
      })
      .catch(err => {
        log.info(Json.toString(err));
        res.end(Json.toString({status: 'FAILED', message: err ? err.message : '不存在此用户！'}))
      })
  } else {
    log.info(Json.toString(err));
    res.end(Json.toString({status: 'FAILED', message: '参数不全！'}))
  }
});

router.post('/register', function (req, res) {
  if (req.body.telephone && req.body.password && req.body.type && req.body.name) {
    let value;
    let sql;
    if (req.body.type === 'teacher') {
      sql = 'insert into teacher set ?';
      value = {
        // login info todo: encrypt password
        telephone: req.body.telephone,
        password_hash: req.body.password,
        salt: '1',
        // user info
        name: req.body.name,
        subject: req.body.subject,
        address: req.body.address || '',
        // metadata
        created_time: new Date(),
        updated_time: new Date()
      };
    } else {
      sql = 'insert into student set ?';
      value = {
        telephone: req.body.telephone,
        password_hash: req.body.password,
        salt: '1',

        name: req.body.name,
        school: req.body.school,
        degree: req.body.degree,
        address: req.body.address || '',

        created_time: new Date(),
        updated_time: new Date()
      };
    }
    DB.update(sql, value)
      .then(results => {
        res.status(201).end(Json.toString({status: 'SUCCEED', id: results.insertId}));
      })
      .catch(err => {
        log.info(Json.toString(err));
        res.end(Json.toString({status: 'FAILED', message: err ? err.message : '注册用户失败！'}))
      });
  } else {
    res.end(Json.toString({status: 'FAILED', message: '姓名密码或者注册类型参数校验错误'}));
  }
});

module.exports = router;
