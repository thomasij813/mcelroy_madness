var express = require('express');
var rp = require('request-promise');
var parseString = require('xml2js').parseString;
var Promise = require('promise');
var api = require('../api/programs.js');

var router = express.Router();

router.get('/allrecent', api.mostRecent);

module.exports = router;
