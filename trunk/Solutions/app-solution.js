/*jslint node:true*/
/*eslint no-unused-params:0*/
/* These lines are hints to the code editor */

/**
 * Load the appropriate modules for our web application
*/
var express = require('express');
var http = require('http');
var path = require('path');
var morgan = require('morgan');
var redis = require('redis');

/**
*** Initial setup
**/
if (process.env.VCAP_SERVICES) {
  var env = JSON.parse(process.env.VCAP_SERVICES);
  var credentials = env['redis-2.6'][0]['credentials'];
} else {
  var credentials = {"host":"127.0.0.1", "port":5556, "username":"user1",
    "password":"secret"}
}

var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0');

/**
 * Setup the Express engine
**/
var app = express();
app.set('port', port);
app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Connect to the Redis database
**/
var client = redis.createClient(credentials.port, credentials.host);
if (credentials.password != '') {
    client.auth(credentials.password);
}
client.on("error", function (err) {
        console.log("Error " + err);
});

/**
 * This is our home route.  This gets called when we visit our
 * base address http://MYSERVERNAME.mybluemix.net/
**/
var userCount = 0;
app.get('/', function(req, res) {
    userCount = userCount + 1;
    // Increment the value in the database and render the results
    client.incrby("DBuserCountBy1", 1, function (err, replyBy1) {
        client.incrby("DBuserCountBy2", 2, function (err, replyBy2) {
            res.render('index', {userCount: userCount, DBuserCountBy1: replyBy1, DBuserCountBy2: replyBy2});
        });
    });
});

/**
 * This is where the server is created and run.  Everything previous to this
 * was configuration for this server.
**/
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



