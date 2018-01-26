var express = require('express');
var router = express.Router();
var DB = require('../utils/db');
var Json = require('../utils/json');

// 创建单个课程报名(老师， 学生， 课程)
router.post('/', function (req, res, next) {
  if (req.session.type === 'teacher'
      && req.body.studentId && req.body.type && req.body.hours) {
    DB.query('select * from subject where teacher_id=? and student_id=? and type=?',
      [req.session.userId, req.body.studentId, req.body.type], function (err, results, fields) {
        if (err) {
          res.end(Json.toString({status: 'FAILED', message: err.message}))
        } else {
          if (!results.length) {
            var subject = {
              teacher_id: req.session.userId,
              student_id: req.body.studentId,
              type: req.body.type,
              created_time: new Date(),
              updated_time: new Date()
            };
            DB.update('insert into subject set ?', subject, function (err, results2, fields2) {
              if (err) {
                res.end(Json.toString({status: 'FAILED', message: err.message}))
              } else {
                var registration = {
                  subject_id: results2.insertId,
                  hours: req.body.hours,
                  amount: req.body.amount,
                  created_time: new Date()
                };
                DB.transactionalUpdate('insert into subject_registration set ?', registration,
                  'update subject set '
                  + 'total_hours=total_hours+?, available_hours=available_hours+? '
                  + 'WHERE id=?', [registration.hours, registration.hours, registration.subject_id],
                  function (err, results3, fields3) {
                    res.end(Json.toString({status: 'SUCCESS', message: '执行成功!'}));
                  });
              }
            })
          } else {
            var registration = {
              subject_id: results[0].id,
              hours: req.body.hours,
              amount: req.body.amount,
              created_time: new Date()
            };
            DB.transactionalUpdate('insert into subject_registration set ?', registration,
              'update subject set '
              + 'total_hours=total_hours+?, available_hours=available_hours+? '
              + 'WHERE id=?', [registration.hours, registration.hours, registration.subject_id],
              function (err, results2, fields2) {
                if (err) {
                  res.end(Json.toString({status: 'FAILED', message: err.message}))
                } else {
                  res.end(Json.toString({status: 'SUCCESS', message: '执行成功!'}));
                }
              }
            );
          }
        }
      });
  } else {
    res.end(Json.toString({status: 'FAILED', message: '只有老师可以创建课程或者参数不全!'}))
  }
});

// 查询老师下某个学生某个课程报名情况
router.get('/registrations', function (req, res, next) {
  var sql = 'SELECT t.name, r.* FROM subject s '
            + 'LEFT JOIN subject_registration r ON s.id=r.subject_id '
            + 'LEFT JOIN student t ON s.student_id = t.id '
            + 'WHERE s.teacher_id = ? AND s.student_id = ? AND s.id = ?'
            + 'ORDER BY r.id';
  DB.query(sql, [req.session.userId, req.query.studentId, req.query.subjectId],
    function (err, results, fields) {
      if (err) {
        res.end(Json.toString({status: 'FAILED', message: err.message}))
      } else {
        res.end(Json.toString(results));
      }
    });
});

// 查询老师某个学生报名情况
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
