var express = require('express');
var router = express.Router();
var DB = require('../utils/db');
var Json = require('../utils/json');

// 查询某个时间范围的课程安排
router.get('/', function (req, res) {
  var sql = 'SELECT t.name as teacherName, s.name as studentName, t.subject, ss.type, a.* '
            + 'FROM subject_assignment a '
            + 'LEFT JOIN teacher t ON a.teacher_id=t.id '
            + 'LEFT JOIN student s ON a.student_id=s.id '
            + 'LEFT JOIN subject ss ON a.subject_id=ss.id ';
  if (req.session.type === 'teacher') {
    sql += 'WHERE a.teacher_id = ? and scheduled_time BETWEEN ? and ?'
  } else {
    sql += 'WHERE a.student_id = ? and scheduled_time BETWEEN ? and ?'
  }

  DB.query(sql, [req.session.userId, req.query.start, req.query.end],
    function (err, results, fields) {
      if (err) {
        res.end(Json.toString({status: 'FAILED', message: err.message}))
      } else {
        if (results.length) {
          results = results;
        }
        res.end(Json.toString(results));
      }
    });
});

// 创建一个安排
router.post('/', function (req, res) {
  if (req.session.type === 'teacher'
      && req.session.userId
      && req.body.subjectId
      && req.body.studentId
      && req.body.scheduledTime
      && req.body.positionX && req.body.positionX > 0 && req.body.positionX < 8
      && req.body.positionY && req.body.positionY > 0 && req.body.positionY < 8) {
    DB.update("insert into subject_assignment set ?", {
      teacher_id: req.session.userId,
      student_id: req.body.studentId,
      subject_id: req.body.subjectId,
      scheduled_time: req.body.scheduledTime,
      hours: req.body.hours || 2,
      x: req.body.positionX,
      y: req.body.positionY,
      created_time: new Date()
    }, function (err, results, fileds) {
      if (err) {
        res.end(Json.toString({status: 'FAILED', message: err.message}))
      } else {
        res.end(Json.toString({status: 'SUCCEED'}));
      }
    });
  } else {
    res.end(Json.toString({status: 'FAILED', message: '登录参数不全！'}))
  }
});

module.exports = router;
