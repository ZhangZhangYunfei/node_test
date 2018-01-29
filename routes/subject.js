var express = require('express');
var router = express.Router();
var DB = require('../utils/db');
var Json = require('../utils/json');

router.get('/', function (req, res, next) {
  var sql = 'SELECT s2.name as student_name, s.* '
            + 'FROM subject s left join student s2 on s.student_id = s2.id '
            + 'WHERE teacher_id = ?';
  DB.query(sql, [req.session.userId], function (err, results, fields) {
    if (err) {
      res.end(Json.toString({status: 'FAILED', message: err.message}))
    } else {
      res.end(Json.toString(results));
    }
  });
});

// 查询老师下某个学生所有课程
router.get('/student', function (req, res, next) {
  var sql = 'SELECT s2.name as student_name, s.* '
            + 'FROM subject s left join student s2 on s.student_id = s2.id '
            + 'WHERE teacher_id = ? AND student_id = ?';
  DB.query(sql, [req.session.userId, req.query.studentId], function (err, results, fields) {
    if (err) {
      res.end(Json.toString({status: 'FAILED', message: err.message}))
    } else {
      res.end(Json.toString(results));
    }
  });
});

// 查询所有报名课程的学生信息
router.get('/students', function (req, res, next) {
  var sql = 'SELECT DISTINCT t.* FROM subject s LEFT JOIN student t on s.student_id = t.id '
            + 'where teacher_id = ?';
  DB.query(sql, [req.session.userId], function (err, results, fields) {
    if (err) {
      res.end(Json.toString({status: 'FAILED', message: err.message}))
    } else {
      res.end(Json.toString(results));
    }
  });
});

module.exports = router;
