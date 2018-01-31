var Json = {};
module.exports = Json;

Json.toString = function (object) {
  return JSON.stringify(object, 0, 4);
};
