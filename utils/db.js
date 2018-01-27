var DB = {};
module.exports = DB;

DB.pool = require('mysql').createPool({
  host: '10.9.12.180',
  port: '3306',
  user: 'root',
  password: 'password',
  database: 'braavos',
  connectionLimit: 10
});

DB.transactionalUpdate =
  function (firstSql, firstParams, secondSql, secondParam, callback, predict) {
    DB.pool.getConnection(function (err, connection) {
      if (err) {
        callback(err);
      }

      connection.beginTransaction(function (err) {
        if (err) {
          callback(err);
        }
        connection.query(firstSql, firstParams, function (error, results, fields) {
          if (error) {
            return connection.rollback(function () {
              callback(error);
            });
          }

          if (!predict || predict(results)) {
            connection.query({
              sql: secondSql,
              values: secondParam
            }, function (error, results, fields) {
              if (error) {
                return connection.rollback(function () {
                  callback(error);
                });
              }
              connection.commit(function (err) {
                if (err) {
                  return connection.rollback(function () {
                    callback(err);
                  });
                }
                connection.release();
                if (callback) {
                  callback(null, results, fields);
                }
              });
            });
          }
        });
      });
    });
  };

DB.update = function (sql, value, callback) {
  DB.pool.getConnection(function (err, connection) {
    if (err) {
      callback(err);
    }
    connection.query(sql, value, function (error, results, fields) {
      // And done with the connection.
      connection.release();
      // Handle error after the release.
      if (callback) {
        callback(error, results, fields);
      }
    })
  });
};

DB.query = function (sql, params, callback) {
  DB.pool.getConnection(function (err, connection) {
    if (err) {
      callback(err);
    }
    connection.query({
      sql: sql,
      values: params
    }, function (error, results, fields) {
      connection.release();
      if (callback) {
        callback(error, results, fields);
      }
    })
  });
};


