// modules
var express = require('express');
var routes = require('./routes/index');
var http = require('http');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var env = require('dotenv').load();

// create an instance of Express
var app = express();

const uri = 'mongodb://' + process.env.MONGO_USER + ':' + process.env.MONGO_PWD 
  + '@' + process.env.MONGO_HOST + '-shard-00-00-abqor.mongodb.net:27017,' 
  + process.env.MONGO_HOST + '-shard-00-01-abqor.mongodb.net:27017,' 
  + process.env.MONGO_HOST + '-shard-00-02-abqor.mongodb.net:27017/' 
  + process.env.MONGO_DB 
  + '?ssl=true&authSource=admin';
mongoose.connect(uri);
// mongoose.connect('mongodb://localhost:27017/donuts');

// all environments
app.set('port', process.env.PORT || 3000);

// set the view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

// middlewares
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
   app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.send(err.message);
    });
}

// router middleware
app.get('/', routes);

// start the app
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

//routes.sockets.connect(server);
require('./routes/sockets.js').initialize(server);