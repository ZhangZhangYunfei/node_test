var express = require('express');
var router = express.Router();
var DB = require('../utils/db');
var Json = require('../utils/json');
var log = require('../utils/log');

// 查询某个时间范围的课程安排
router.get('/', function (req, res) {
  log.info('Querying the assignment with params %s, %s', req.query.start, req.query.end);
  if (req.query.start && req.query.end) {
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
          log.info(Json.toString(results));
          var elements = [];
          for (var row = 1; row < 8; row++) {
            var data = {};
            for (var column = 1; column < 8; column++) {
              var assigns = [];
              for (var index in results) {
                if (results[index].x === column && results[index].y === row) {
                  assigns.push(results[index])
                }
              }
              switch (column) {
                case 1:
                  data.monday = assigns;
                  continue;
                case 2:
                  data.tuesday = assigns;
                  continue;
                case 3:
                  data.wednesday = assigns;
                  continue;
                case 4:
                  data.thursday = assigns;
                  continue;
                case 5:
                  data.friday = assigns;
                  continue;
                case 6:
                  data.saturday = assigns;
                  continue;
                case 7:
                default:
                  data.sunday = assigns;
              }
            }
            elements[row - 1] = data;
          }
          res.end(Json.toString(elements))
        }
      });
  } else {
    res.end(Json.toString({status: 'FAILED', message: '参数不全！'}))
  }
});

// 查询某个课程某个学生的安排
router.get('/student', function (req, res) {
  if (req.query.studentId && req.query.subjectId) {
    var sql = 'SELECT t.name as teacherName, s.name as studentName, t.subject, ss.type, a.* '
              + 'FROM subject_assignment a '
              + 'LEFT JOIN teacher t ON a.teacher_id=t.id '
              + 'LEFT JOIN student s ON a.student_id=s.id '
              + 'LEFT JOIN subject ss ON a.subject_id=ss.id '
              + 'WHERE a.teacher_id = ? and a.student_id = ? and a.subject_id = ?'
    DB.query(sql, [req.session.userId, req.query.studentId, req.query.subjectId],
      function (err, results, fields) {
        if (err) {
          res.end(Json.toString({status: 'FAILED', message: err.message}))
        } else {
          res.end(Json.toString(results))
        }
      });
  } else {
    res.end(Json.toString({status: 'FAILED', message: '参数不全！'}))
  }
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
    DB.query('select * from subject where id=? and student_id=?',
      [req.body.subjectId, req.body.studentId],
      function (error, results, fields) {
        if (error || !results.length) {
          res.end(Json.toString({status: 'FAILED', message: error ? error.message : '无课程记录！'}))
        } else {
          var firstSql = "insert into subject_assignment set ?";
          var firstVal = {
            teacher_id: req.session.userId,
            student_id: req.body.studentId,
            subject_id: req.body.subjectId,
            scheduled_time: req.body.scheduledTime,
            hours: req.body.hours || 2,
            x: req.body.positionX,
            y: req.body.positionY,
            created_time: new Date()
          };
          var secondSql = 'UPDATE subject '
                          + 'SET available_hours=available_hours-?, reserved_hours=reserved_hours+? '
                          + 'WHERE id=?';
          var secondParams = [firstVal.hours, firstVal.hours, firstVal.subject_id];
          DB.transactionalUpdate(firstSql, firstVal, secondSql, secondParams,
            function (err, results, fields) {
              if (err) {
                res.end(Json.toString({status: 'FAILED', message: err.message}))
              } else {
                res.end(Json.toString({status: 'SUCCEED'}));
              }
            })
        }
      });
  } else {
    res.end(Json.toString({status: 'FAILED', message: '只有老师可以访问，参数不全！'}))
  }
});

// 确认一个安排已经结束
router.post('/:id', function (req, res) {
  if (req.session.type === 'teacher') {
    DB.query('select * from subject_assignment where id=? and status=0', [req.params.id],
      function (err, results, fields) {
        if (err) {
          res.end(Json.toString({status: 'FAILED', message: err.message}))
        } else {
          if (results.length) {
            DB.transactionalUpdate('update subject_assignment set status=1 where id=? and status=0',
              [req.params.id],
              'update subject set reserved_hours=reserved_hours-? where id=?',
              [results[0].hours, results[0].subject_id], function (err, results, fields) {
                if (err) {
                  res.end(Json.toString({status: 'FAILED', message: err.message}))
                } else {
                  res.end(Json.toString({status: 'SUCCEED'}));
                }
              }, function (results) {
                return results.rowsAffected = 1;
              })
          } else {
            res.end(Json.toString({status: 'FAILED', message: '没有满足条件的记录！'}))
          }
        }
      })
  } else {
    res.end(Json.toString({status: 'FAILED', message: '只有老师可以访问，参数不全！'}))
  }
});

// 删除一个没有完成的安排
router.delete('/:id', function (req, res) {
  if (req.session.type === 'teacher') {
    DB.query('select * from subject_assignment where id=? and status=0', [req.params.id],
      function (err, results, fields) {
        if (err) {
          res.end(Json.toString({status: 'FAILED', message: err.message}))
        } else {
          if (results.length) {
            DB.transactionalUpdate('delete from subject_assignment where id=? and status=0',
              [req.params.id],
              'update subject set available_hours=available_hours+?, reserved_hours=reserved_hours-?'
              + ' where id=?',
              [results[0].hours, results[0].hours, results[0].subject_id],
              function (err, results, fields) {
                if (err) {
                  res.end(Json.toString({status: 'FAILED', message: err.message}))
                } else {
                  res.end(Json.toString({status: 'SUCCEED'}));
                }
              }, function (results) {
                return results.rowsAffected = 1;
              })
          } else {
            res.end(Json.toString({status: 'FAILED', message: '没有满足条件的记录！'}))
          }
        }
      })
  } else {
    res.end(Json.toString({status: 'FAILED', message: '只有老师可以访问，参数不全！'}))
  }
});

module.exports = router;
