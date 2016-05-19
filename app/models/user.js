var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = new Schema({
  username: String,
  password: String
});

User.pre('save', function(next) {
  this.set('password', bcrypt.hashSync(this.password));
  next();
});

module.exports = mongoose.model('User', User);
