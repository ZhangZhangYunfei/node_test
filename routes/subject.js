let express = require('express');
let router = express.Router();
let DB = require('../utils/db');
let Json = require('../utils/json');
let log = require('../utils/log');

// 查询某个老师的所有学生所报名课程
router.get('/', function (req, res, next) {
  let sql = 'SELECT s2.name as student_name, s.* '
            + 'FROM subject s left join student s2 on s.student_id = s2.id '
            + 'WHERE teacher_id = ?';
  DB.query(sql, [req.session.userId])
    .then(results => {
      res.end(Json.toString(results));
    })
    .catch(err => {
      log.info(Json.toString(err));
      res.end(Json.toString({status: 'FAILED', message: err ? err.message : '没有记录！'}))
    })
});

// 查询老师下某个学生所有课程
router.get('/student', function (req, res, next) {
  let sql = 'SELECT s2.name as student_name, s.* '
            + 'FROM subject s left join student s2 on s.student_id = s2.id '
            + 'WHERE teacher_id = ? AND student_id = ?';
  DB.query(sql, [req.session.userId, req.query.studentId])
    .then(results => {
      res.end(Json.toString(results));
    })
    .catch(err => {
      log.info(Json.toString(err));
      res.end(Json.toString({status: 'FAILED', message: err ? err.message : '没有记录！'}))
    })
});

// 查询所有报名课程的学生信息
router.get('/students', function (req, res, next) {
  let sql = 'SELECT DISTINCT t.* FROM subject s LEFT JOIN student t on s.student_id = t.id '
            + 'where teacher_id = ?';
  DB.query(sql, [req.session.userId])
    .then(results => {
      log.info(Json.toString(results));
      res.end(Json.toString(results));
    })
    .catch(err => {
      log.info(Json.toString(err));
      res.end(Json.toString({status: 'FAILED', message: err ? err.message : '没有记录！'}))
    })
});

module.exports = router;
