// app/models/user.js
// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        :  {type: String, unique : true, required: true, dropDups: true},
        password     :  String,
        name         :  String,
        studentId    :  String,
        programOfStudy: String,
        address:        String,
        phoneNo:        String,
        hasCar:         Boolean,
        role:           String,
        status:         String,
        mentorId:       String,
        studentsCount:  { type: Number, default: 0 },
        img:            String
//        students:       [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    }

});

// methods ======================
// generating a hash

userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};
userSchema.methods.find = function(){
    mongoose.find({}, function (err, docs) {
        JSON.stringify(docs);
        return docs;
//        res.json(docs);
    })
}
userSchema.set('toJSON', {
    getters: true,
    virtuals: true
});
// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
