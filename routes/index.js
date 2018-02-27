let express = require('express');
let router = express.Router();
let path = require('path');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.sendfile(path.join(__dirname, '../views', 'index.html'));
});

module.exports = router;
