// config/auth.js

// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '1674543406119681', // your App ID
        'clientSecret'  : '2231ce64372bf13797e6f0191b5b6aa6', // your App Secret
        'callbackURL'   : 'http://localhost:3000/auth/facebook/callback',
        profileFields : ['id', 'email', 'gender']
    },

    'twitterAuth' : {
        'consumerKey'       : 'your-consumer-key-here',
        'consumerSecret'    : 'your-client-secret-here',
        'callbackURL'       : 'http://localhost:8080/auth/twitter/callback'
    },

    'googleAuth' : {
        'clientID'      : 'your-secret-clientID-here',
        'clientSecret'  : 'your-client-secret-here',
        'callbackURL'   : 'http://localhost:8080/auth/google/callback'
    }

};