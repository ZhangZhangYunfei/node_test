let express = require('express');
let router = express.Router();
let DB = require('../utils/db');
let Json = require('../utils/json');
let log = require('../utils/log');

// 创建单个课程报名(老师， 学生， 课程)，如果课程不存在先创建课程后报名
router.post('/', function (req, res, next) {
  if (req.session.type === 'teacher'
      && req.body.studentId && req.body.type && req.body.hours) {
    DB.query('select * from subject where teacher_id=? and student_id=? and type=?',
      [req.session.userId, req.body.studentId, req.body.type],
      function (results) {
        return results != null;
      })
      .then(results => {
        if (results.length) {
          return new Promise(function (resolve, reject) {
            setTimeout(function () {
              resolve(results);
            }, 0)
          });
        } else {
          let subject = {
            teacher_id: req.session.userId,
            student_id: req.body.studentId,
            type: req.body.type,
            created_time: new Date(),
            updated_time: new Date()
          };
          return DB.update('insert into subject set ?', subject)
        }
      })
      .then(results => {
        let registration = {
          subject_id: results.insertId || results[0].id,
          hours: req.body.hours,
          amount: req.body.amount,
          created_time: new Date()
        };
        return DB.transactionalUpdate('insert into subject_registration set ?', registration,
          'update subject set total_hours=total_hours+?, available_hours=available_hours+? WHERE id=?',
          [registration.hours, registration.hours, registration.subject_id])
      })
      .then(results => {
        res.end(Json.toString({status: 'SUCCESS', message: '执行成功!'}));
      })
      .catch(err => {
        log.info(Json.toString(err));
        res.end(Json.toString({status: 'FAILED', message: err ? err.message : '没有满足条件的记录！'}))
      })
  } else {
    res.end(Json.toString({status: 'FAILED', message: '只有老师可以创建课程或者参数不全!'}));
  }
});

// 查询老师下某个学生某个课程所有报名记录
router.get('/', function (req, res, next) {
  if (req.session.type === 'teacher'
      && req.query.studentId
      && req.query.subjectId) {
    let sql = 'SELECT t.name, r.* FROM subject s '
              + 'LEFT JOIN subject_registration r ON s.id=r.subject_id '
              + 'LEFT JOIN student t ON s.student_id = t.id '
              + 'WHERE s.teacher_id = ? AND s.student_id = ? AND s.id = ?'
              + 'ORDER BY r.id';
    DB.query(sql, [req.session.userId, req.query.studentId, req.query.subjectId])
      .then(results => {
        res.end(Json.toString(results));
      })
      .catch(err => {
        log.info(Json.toString(err));
        res.end(Json.toString({status: 'FAILED', message: err ? err.message : '没有记录！'}))
      })
  } else {
    res.end(Json.toString({status: 'FAILED', message: '只有老师可以查询课程报名情况或者参数不全!'}));
  }
});

module.exports = router;
