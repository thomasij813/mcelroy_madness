var express = require('express');
var rp = require('request-promise');
var parseString = require('xml2js').parseString;
var Promise = require('promise');
var api = require('../api/programs.js');

var googleApiKey = 'AIzaSyA12J9ITYBJmtdbs68gwWRWWEm0owoUliY';

var router = express.Router();

router.get('/', function(req, res) {
  res.render('index');
});

module.exports = router;
