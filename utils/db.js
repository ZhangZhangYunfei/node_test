var DB = {};
module.exports = DB;

DB.pool = require('mysql').createPool({
  host: '192.168.154.128',
  port: '3306',
  user: 'root',
  password: 'password',
  database: 'braavos',
  connectionLimit: 10
});

DB.transactionalUpdate = function (firstSql, firstParams, secondSql, secondParam, callback) {
  DB.pool.getConnection(function (err, connection) {
    if (err) {
      next(err);
    }

    connection.beginTransaction(function (err) {
      if (err) {
        throw err;
      }
      connection.query(firstSql, firstParams, function (error, results, fields) {
        if (error) {
          return connection.rollback(function () {
            throw error;
          });
        }

        connection.query({
          sql: secondSql,
          values: secondParam
        }, function (error, results, fields) {
          if (error) {
            return connection.rollback(function () {
              throw error;
            });
          }
          connection.commit(function (err) {
            if (err) {
              return connection.rollback(function () {
                throw err;
              });
            }
            connection.release();
            if (callback) {
              callback(results, fields);
            }
          });
        });
      });
    });

    connection.query({
      sql: sql,
      values: params
    }, function (error, results, fields) {
      connection.release();
      if (error) {
        next(err);
      }

      if (callback) {
        callback(results, fields);
      }
    })
  });
};

DB.update = function (sql, value, callback) {
  DB.pool.getConnection(function (err, connection) {
    if (err) {
      next(err);
    }
    connection.query(sql, value, function (error, results, fields) {
      // And done with the connection.
      connection.release();
      // Handle error after the release.
      if (error) {
        next(error);
      }
      if (callback) {
        callback(results, fields);
      }
    })
  });
};

DB.query = function (sql, params, callback) {
  DB.pool.getConnection(function (err, connection) {
    if (err) {
      next(err);
    }
    connection.query({
      sql: sql,
      values: params
    }, function (error, results, fields) {
      connection.release();
      if (error) {
        next(err);
      }

      if (callback) {
        callback(results, fields);
      }
    })
  });
};


