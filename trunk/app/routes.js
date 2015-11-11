// app/routes.js
module.exports = function(app, passport, mongoose) {
    var User = require('./models/user');
	// =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		// Increment the value in the database and render the results
		res.render('index.ejs'); /* add DBuserCountBy2 */
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('pages/login.ejs', { message: req.flash('loginMessage') });
	});
	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/login', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('pages/signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }
        )
    );

	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
        var sentId = req.param('userId');
        if(sentId!=undefined){
            User.findById(sentId, function(err, user) {
                if (err) throw err;
                // change the users location
//                user.local.status = 'pending';
                user.local.status = 'active';
                // save the user
                user.save(function(err) {
                    if (err) throw err;
                    console.log('User successfully updated!');
                    User.find().where('local.role').equals('mentor').where('local.status').equals('pending').exec(function(err, users) {
                        if (err) throw err;
                        console.log("All users: "+JSON.stringify(users));
                        res.send(users);
                    });
                });
            });

        }else{
            if(req.user.local.role=='mentor'){
                res.render('pages/profile.ejs', {
                    user : req.user // get the user out of session and pass to template
                });
            }else{
                // get all the users
                User.find().where('local.role').equals('mentor').where('local.status').equals('pending').exec(function(err, users) {
                    if (err) throw err;
                    console.log("All users: "+JSON.stringify(users));
                    res.render('pages/adminprofile.ejs', {
                        user : req.user, // get the user out of session and pass to template
                        pendingMentors:users
                    });
                });
            }
        }
	});

	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	app.get('/about', function(req,res){
		res.render('pages/about');
	});
	app.get('/contact', function(req,res){
		res.render('pages/contactus');
	});
	app.post('/sendcontact', function(req,res){
		res.render('pages/underconstruction');
	});
	app.get('/registermentor', function(req,res){
		res.render('pages/underconstruction');
	});
	app.get('/events', function(req,res){
		res.render('pages/underconstruction');
	});

};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

