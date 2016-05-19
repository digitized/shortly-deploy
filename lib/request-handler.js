var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var util = Promise.promisifyAll(require('../lib/utility'));


var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
// var Users = require('../app/collections/users');
// var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function() {
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  // Links.reset().fetch().then(function(links) {
  //   res.status(200).send(links.models);
  // });
  Link.find({})
    .then( links => res.status(200).send(links) );
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  Link.findOne({url: uri})
    .then( found => {
      if (found) {
        res.status(200).send(found);
      } else {
        return util.getUrlTitleAsync(uri);
      }
    })
    .then( title => {
      var newLink = new Link({
        url: uri,
        title: title,
        baseUrl: req.headers.origin
      });
      return newLink.save();
    })
    .then(() => res.status(200).send(newLink))
    .catch( err => {
      console.log('Error somewhere: ', err);
      return res.sendStatus(404);
    });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username: username}, function(err, found) {
    if (found) {
      if (bcrypt.compareSync(password, found.get('password'))) {
        util.createSession(req, res, found);
      } else {
        res.redirect('/login');
      }
    } else {
      res.redirect('/login');
    }
  });

};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  
  User.findOne({username: username})
    .then( found => {
      if (found) {
        console.log('Account already exists');
        res.redirect('/signup');
      } else {
        var newUser = new User({
          username: username,
          password: password,
        });
        return newUser.save();
      }
    })
    .then( () => {
      util.createSession(req, res, newUser);
    })
    .catch( err => console.log('ERROR: ', err));

};

exports.navToLink = function(req, res) {
  Link.findOne({ code: req.params[0] })
    .then( link => {
      if (!link) {
        res.redirect('/');
      } else {
        link.set({ visits: link.get('visits') + 1 }).save()
          .then( () => res.redirect(link.get('url')) );
      }
    });
};