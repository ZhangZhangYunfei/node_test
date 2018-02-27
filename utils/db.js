var config = require('./config');

var DB = {};
module.exports = DB;

DB.pool = require('mysql').createPool({
  host: config.mysqlHost,
  port: config.mysqlPort,
  user: config.mysqlUser,
  password: config.mysqlPassword,
  database: config.mysqlDatabase,
  connectionLimit: 10
});

DB.transactionalUpdate =
  function (firstSql, firstParams, secondSql, secondParam, predict) {
    return new Promise(function (resolve, reject) {
      DB.pool.getConnection(function (error, connection) {
        if (error) {
          return reject(error);
        }

        connection.beginTransaction(function (error) {
          if (error) {
            return reject(error);
          }
          connection.query(firstSql, firstParams, function (error, results, fields) {
            if (error) {
              return connection.rollback(function () {
                reject(error);
              });
            }
            if ((predict && !predict(results)) || (!predict && !results.affectedRows === 1)) {
              return reject(error);
            }

            connection.query({
              sql: secondSql,
              values: secondParam
            }, function (error, results, fields) {
              if (error) {
                return connection.rollback(function () {
                  reject(error);
                });
              }
              connection.commit(function (error) {
                if (error) {
                  return connection.rollback(function () {
                    reject(error);
                  });
                }
                connection.release();
                resolve(results, fields);
              });
            });
          });
        });
      });
    });
  };

DB.update = function (sql, value, predict) {
  return new Promise(function (resolve, reject) {
    DB.pool.getConnection(function (error, connection) {
      if (error) {
        return reject(error);
      }
      connection.query(sql, value, function (error, results, fields) {
        // And done with the connection.
        connection.release();
        // Handle error after the release.
        if (error) {
          return reject(error);
        }
        if (predict && !predict(results)) {
          return reject(error);
        }
        resolve(results, fields);
      })
    });
  });
};

DB.query = function (sql, params, predict) {
  return new Promise(function (resolve, reject) {
      DB.pool.getConnection(function (error, connection) {
        if (error) {
          return reject(error);
        }
        connection.query({
          sql: sql,
          values: params
        }, function (error, results, fields) {
          connection.release();
          if (error) {
            return reject(error);
          }
          // 提供了predict就一定要成功，不提供则默认用length
          if ((predict && !predict(results)) || (!predict && !results.length)) {
            return reject(error);
          }
          resolve(results, fields);
        })
      });
    }
  )
};


