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
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

/**
*** Initial setup
**/
if (process.env.VCAP_SERVICES) {
  var env = JSON.parse(process.env.VCAP_SERVICES);
}

var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || '0.0.0.0');

/**
 * Setup the Express engine
**/
var app = express();

app.configure(function() {
    app.set('port', port);
    app.set('view engine', 'ejs');

    app.use(morgan('dev'));
    app.use(express.static(path.join(__dirname, 'public')));
    // set up our express application
    app.use(express.logger('dev')); // log every request to the console
    app.use(express.cookieParser()); // read cookies (needed for auth)
    app.use(express.bodyParser()); // get information from html forms

    app.set('view engine', 'ejs'); // set up ejs for templating

    // required for passport
    app.use(express.session({ secret: 'ilovescotchscotchyscotchscotch' })); // session secret
    app.use(passport.initialize());
    app.use(passport.session()); // persistent login sessions
    app.use(flash()); // use connect-flash for flash messages stored in session

});
require('./app/routes.js')(app, passport, mongoose);

/**
 * This is our home route.  This gets called when we visit our
 * base address http://MYSERVERNAME.mybluemix.net/
**/



/**
 * This is where the server is created and run.  Everything previous to this
 * was configuration for this server.
**/
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});



