// app/routes.js
module.exports = function(app, passport, mongoose) {
    var User = require('./models/user');
    var ahoy = require('../config/ahoy');
    var fs = require('fs');
    // =====================================
	// HOME PAGE (with login links) ========
	// =====================================
	app.get('/', function(req, res) {
		// Increment the value in the database and render the results
		res.render('index.ejs',{
            user : req.user // get the user out of session and pass to template
        }); /* add DBuserCountBy2 */
	});

	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {

		// render the page and pass in any flash data if it exists
		res.render('pages/login.ejs', { user:req.user, message: req.flash('loginMessage'),finalMessage:req.flash('signupFinish')});
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
        var signupFinish = req.flash('signupFinish');
        var signupMessage = req.flash('signupMessage');
        var sessionUser = req.flash('newUser');
        if(signupMessage.length>0){
		    res.render('pages/signup.ejs', { user: req.user, message: signupMessage,finalMessage:signupFinish});
        }else if(signupFinish.length>0){

            res.render('pages/login.ejs', { user: req.user, message: signupMessage,finalMessage:signupFinish});
        }else{
            res.render('pages/signup.ejs', { user: req.user, message: signupMessage,finalMessage:signupFinish});
        }
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
        if(req.user.local.role=='mentor'){
            res.render('pages/profile.ejs', {
                user : req.user // get the user out of session and pass to template
            });
        }else if(req.user.local.role=='student'){
            var theStudent = req.user;
            if(theStudent.local.mentorId == null){
                res.render('pages/studentprofile.ejs', {
                    user : req.user // get the user out of session and pass to template
                });
            }else{
                User.findById(theStudent.local.mentorId,function(err,user){
                    res.render('pages/studentprofile.ejs', {
                        user : req.user, // get the user out of session and pass to template
                        mentor: user
                    });
                });
            }

        }else{
            User.find().where('local.role').equals('mentor').where('local.status').equals('pending').exec(function(err, users) {
                if (err) throw err;
                console.log("All users: "+JSON.stringify(users));
                res.render('pages/adminprofile.ejs', {
                    user : req.user, // get the user out of session and pass to template
                    pendingMentors:users
                });
            });
        }
	});

    // =====================================
    // ADMIN ACTIONS =======================
    // =====================================

    app.get('/acceptMentor', isLoggedIn, function(req, res) {
        var sentId = req.param('userId');
        User.findById(sentId, function(err, user) {
            if (err) throw err;
            // change the users location
//            user.local.status = 'pending';
            user.local.status = 'active';
            // save the user
            user.save(function(err) {
                if (err) throw err;
                console.log('User successfully updated!');
                ahoy.sendSMS(user.local.phoneNo,"Hello "+user.local.name+"! Your request for registration was accepted. With love, from G-Help.");
                User.find().where('local.role').equals('mentor').where('local.status').equals('pending').exec(function(err, users) {
                    if (err) throw err;
                    console.log("All users: "+JSON.stringify(users));
                    res.send(users);
                });
            });
        });
    });
    app.get('/rejectMentor', isLoggedIn, function(req, res) {
        var sentId = req.param('userId');
        User.findById(sentId, function(err, user) {
            if (err) throw err;
            // change the users location
//                user.local.status = 'pending';
            // save the user
            var pathToDelete = "public/repository/profiles/"+user.local.email;
            user.remove(function(err) {
                if (err) throw err;
                console.log('User successfully destroyed!');
                deleteFolderRecursive(pathToDelete);
                ahoy.sendSMS(user.local.phoneNo,"Hello "+user.local.name+"! Your request for registration was denied. With love, from G-Help.");
                User.find().where('local.role').equals('mentor').where('local.status').equals('pending').exec(function(err, users) {
                    if (err) throw err;
                    console.log("All users: "+JSON.stringify(users));
                    res.send(users);
                });
            });
        });
    });

    // =====================================
    // MENTOR ACTIONS ======================
    // =====================================
    app.get('/students', isLoggedIn, function(req, res) {
        User.find().where('local.mentorId').equals(req.user.id).exec(function(err, users) {
            res.render('pages/students.ejs', {
                user : req.user, // get the user out of session and pass to template
                students: users
            });
        })

    });

    // =====================================
    // STUDENT ACTIONS =====================
    // =====================================
    app.get('/reqMentorForm', isLoggedIn, function(req, res) {
        res.render('pages/requestMentorForm.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });
    app.post('/submitMentorReq', isLoggedIn, function(req, res){
        if(req.user.local.mentorId == null){
            var hasCar = req.param("hasCar");
            var userQuery = User.find().where('local.role').equals('mentor')
                .where('local.status').equals('active')
                .where('local.status').equals('active');
            if (hasCar=='yes'){
                userQuery.where('local.hasCar').equals(true);
            }
            userQuery.sort({'local.studentsCount':1});
            userQuery.exec(function(err, users) {
                if (err) throw err;
                var selectedMentor;
                if(users.length>0){
                    selectedMentor = users[0];
                    if(selectedMentor.local.studentsCount == null){
                        selectedMentor.local.studentsCount = 1;
                    }else{
                        selectedMentor.local.studentsCount++;
                    }
                    selectedMentor.save(function(err) {
                        if (err) throw err;
                        req.user.local.mentorId = selectedMentor.id;
                        req.user.save(function(err){
                            if (err) throw err;
                            res.render('pages/assignedMentor.ejs', {
                                user : req.user, // get the user out of session and pass to template
                                mentor: selectedMentor,
                                message: ''
                            });
                        });
                    });
                }else{
                    res.render('pages/assignedMentor.ejs', {
                        user : req.user, // get the user out of session and pass to template
                        message: ''
                    });
                }
                console.log("All users: "+JSON.stringify(users));
    //            res.send(users);
            });
        }else{
            res.render('pages/assignedMentor.ejs', {
                user : req.user,
                message: 'We have already assigned a mentor to you.'// get the user out of session and pass to template
            });
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
		res.render('pages/about',{
            user: req.user
        });
	});
	app.get('/contact', function(req,res){
		res.render('pages/contactus',{
            user: req.user
        });
	});
	app.post('/sendcontact', function(req,res){
		res.render('pages/underconstruction',{
            user: req.user
        });
	});
	app.get('/registermentor', function(req,res){
		res.render('pages/underconstruction',{
            user: req.user
        });
	});
	app.get('/events', function(req,res){
		res.render('pages/underconstruction',{
            user: req.user
        });
	});
    app.get('/timeline', isLoggedIn, function(req,res){
		res.render('pages/underconstruction',{
            user: req.user
        });
	});
    var deleteFolderRecursive = function(path) {
        if( fs.existsSync(path) ) {
            fs.readdirSync(path).forEach(function(file,index){
                var curPath = path + "/" + file;
                if(fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };

};

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}

