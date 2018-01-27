var express = require('express');
var router = express.Router();
var DB = require('../utils/db');
var Json = require('../utils/json');

// 查询老师下某个学生所有课程
router.get('/', function (req, res, next) {
  var sql = 'SELECT * FROM subject s WHERE teacher_id = ? AND student_id = ?';
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
