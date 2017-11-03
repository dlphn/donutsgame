// module with routes and their handlers

var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log( 'requested index page... serving...');
	res.render('index', { title: 'Go Nuts for Donuts' });
});

module.exports = router;