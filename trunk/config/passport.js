// config/passport.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;
var fs = require('fs');
var FacebookStrategy = require('passport-facebook').Strategy;

// load up the user model
var User       		= require('../app/models/user');
var configAuth      = require('./auth');
var ahoy = require('../config/ahoy');
// expose this function to our app using module.exports
module.exports = function(passport) {

	// =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

 	// =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
	// by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {

		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            var fullName = req.param("fullName");
            var studentId = req.param("studentNo");
            var programOfStudy = req.param("programOfStudy");
            var address = req.param("address");
            var phoneNo = req.param("phoneNo");
            var hasCarStr = req.param("hasCarStr");
            var hasCar = true;
            if(hasCarStr=="yes"){
                hasCar = true;
            }else{
                hasCar = false;
            }

            if (user) {
                return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
            }else{
                var tmp_path = req.files.image.path;
                var target_path = 'public/repository/profiles/';
                target_path = target_path +email+"/";
                fs.mkdir(target_path,true, function(err){
                    if (err&&err.code!='EEXIST') {
                        throw err;
                    } else {
                        target_path =target_path +req.files.image.name;
                        fs.createReadStream(tmp_path).pipe(fs.createWriteStream(target_path));
                        // if there are any errors, return the error
                        if (err)
                            return done(err);

                        // check to see if theres already a user with that email
                        if (user) {
                            return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
                        } else {

                            // if there is no user with that email
                            // create the user
                            var newUser            = new User();

                            // set the user's local credentials
                            newUser.local.email    = email;
                            newUser.local.password = newUser.generateHash(password); // use the generateHash function in our user model
                            newUser.local.name = fullName;
                            newUser.local.studentId = studentId;
                            newUser.local.programOfStudy = programOfStudy;
                            newUser.local.address = address;
                            newUser.local.phoneNo = phoneNo;
                            newUser.local.hasCar = hasCar;
                            newUser.local.role = 'mentor';
                            newUser.local.status = 'pending';
                            newUser.local.img = target_path.split("public")[1];
                            // save the user
                            newUser.save(function(err) {
                                if (err)
                                    throw err;
                                if(role=="student"){
                                    return done(null, newUser);
                                }else{
                                    ahoy.sendSMS(phoneNo,"Welcome to G-Help, "+fullName+"! Your request for registration is pending. Thanks for being a part of G-Help <3");
                                    return done(null, false, req.flash('signupFinish', 'Yay! Registration complete. You can login after your request is accepted. '));
                                }

                            });
                        }
                        fs.unlink(tmp_path, function() {
                            if (err)
                                throw err;
                        });
                    }
                });
            }
        });

    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'email',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) { // callback with email and password from our form

        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to login already exists
        User.findOne({ 'local.email' :  email }, function(err, user) {
            // if there are any errors, return the error before anything else
            if (err)
                return done(err);

            // if no user is found, return the message
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No such user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the user is found but the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong username and/or password.')); // create the loginMessage and save it to session as flashdata
            if(user.local.status=="pending"){
                return done(null, false, req.flash('loginMessage', 'Your request for registration has not been accepted yet. '));
            }

            // all is well, return successful user
            return done(null, user);
        });

    }));

    // =========================================================================
    // FACEBOOK ================================================================
    // =========================================================================
    passport.use(new FacebookStrategy({

            // pull in our app id and secret from our auth.js file
            clientID        : configAuth.facebookAuth.clientID,
            clientSecret    : configAuth.facebookAuth.clientSecret,
            callbackURL     : configAuth.facebookAuth.callbackURL,
            profileFields   : ['id', 'name', 'email', 'gender']

        },

        // facebook will send back the token and profile
        function(token, refreshToken, profile, done) {
            console.log("!!!!!!!!!!!!!: "+JSON.stringify(profile)+"!!!!!!!!!!!!!!!");
            // asynchronous
            process.nextTick(function() {
                // find the user in the database based on their facebook id
                User.findOne({ 'facebook.id' : profile.id }, function(err, user) {
                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err)
                        return done(err);
                    // if the user is found, then log them in
                    if (user) {
                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user found with that facebook id, create them
                        var newUser            = new User();
                        // set all of the facebook information in our user model
                        newUser.facebook.id    = profile.id; // set the users facebook id
                        newUser.facebook.token = token; // we will save the token that facebook provides to the user
                        newUser.facebook.name  = profile.name.givenName+' '+profile.name.familyName; // look at the passport user profile to see how names are returned
                        newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                        // save our user to the database
                        newUser.save(function(err) {
                            if (err)
                                throw err;
                            // if successful, return the new user
                            return done(null, newUser);
                        });
                    }
                });
            });
        }));
};
