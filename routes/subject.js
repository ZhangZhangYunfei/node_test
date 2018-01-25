var express = require('express');
var router = express.Router();
var DB = require('../utils/db');

// 创建单个课程报名
router.post('/', function (req, res, next) {
  if (req.session.type === 'teacher'
      && req.body.studentId && req.body.type && req.body.hours) {
    DB.query('select * from subject where teacher_id=? and student_id=? and type=?',
      [req.session.userId, req.body.studentId, req.body.type], function (results, fields) {
        if (!results.length) {
          var subject = {
            teacher_id: req.session.userId,
            student_id: req.body.studentId,
            type: req.body.type,
            created_time: new Date(),
            updated_time: new Date()
          };
          DB.update('insert into subject set ?', subject, function (results2, fields2) {
            var registration = {
              subject_id: results2[0].id,
              hours: req.body.hours,
              amount: req.body.amount,
              created_time: new Date()
            };
            DB.transactionalUpdate('insert into subject_registration set ?', registration,
              'update subject set '
              + 'total_hours=total_hours+?, available_hours=available_hours+? '
              + 'WHERE id=?', [registration.hours, registration.hours, registration.subject_id],
              function (results3, fields3) {
                res.end(JSON.stringify({status: 'SUCCESS', message: '执行成功!'}));
              });
          })
        } else {
          var registration = {
            subject_id: results[0].id,
            hours: req.body.hours,
            amount: req.body.amount
          };
          DB.transactionalUpdate('insert into subject_registration set ?', registration,
            'update subject set '
            + 'total_hours=total_hours+?, available_hours=available_hours+? '
            + 'WHERE id=?', [registration.hours, registration.hours, registration.subject_id],
            function (results2, fields2) {
              res.end(JSON.stringify({status: 'SUCCESS', message: '执行成功!'}));
            }
          );
        }
      });
  } else {
    res.end(JSON.stringify({status: 'FAILED', message: '只有老师可以创建课程或者参数不全!'}))
  }
});

// 查询老师某个学生报名情况
router.get('/', function (req, res, next) {
  //res.render('index', { title: 'Express' });
});

//查询所有报名课程的学生信息
router.get('/students', function (req, res, next) {
  //res.render('index', { title: 'Express' });
});

module.exports = router;
