//setup
var Auth0Strategy = require('passport-auth0');
var express = require('express');
var passport = require('passport');
var router = express.Router();
var session = require('express-session');
var config = require('../config.js');
var userModel = require('../models/userModel');
var passport = require('passport');
var ObjectID = require('mongodb').ObjectID;
router.use(session({secret: "123secret"/*process.env.PASSPORT_SECRET*/}));
router.use(passport.initialize());
router.use(passport.session());

//auth0 strategy
passport.use(new Auth0Strategy({
        domain: 'libru.auth0.com',
        clientID: process.env.AUTH0_CLIENT_ID || config.getAuth0clientID(),
        clientSecret: process.env.AUTH0_CLIENT_SECRET || config.getAuth0clientSecret(),
        callbackURL: 'http://localhost:3000/signin/callback'
    },
    function(accessToken, refreshToken, extraParams, profile, done) {
        // accessToken is the token to call Auth0 API (not needed in the most cases)
        // extraParams.id_token has the JSON Web Token
        // profile has all the information from the user
        return done(null, profile);
    }
));

passport.serializeUser(function(user, callback) {
    callback(null, user);

});

passport.deserializeUser(function(user, callback) {
  var providerQuery = '';
  var dataToSave = {
      fbID: '',
      githubID: '',
      auth0ID: '',
      firstName: '',
      lastName: ''
  };
  // find which provider user is logging in from and store relevant info
  switch (user.provider) {
      case 'facebook':
          providerQuery = 'fbID';
          dataToSave.firstName = user.name.givenName;
          dataToSave.lastName = user.name.familyName;
          dataToSave.fbID = user.identities[0].user_id;
          break;
      case 'github':
          providerQuery = 'githubID';
          dataToSave.firstName = user.name.givenName;
          dataToSave.lastName = user.name.familyName;
          dataToSave.googleID = user.identities[0].user_id;
          break;
      case 'auth0':
          providerQuery = 'auth0ID';
          dataToSave.auth0ID = user.identities[0].user_id;
          break;
  }
  var name = providerQuery;
  var value = user.identities[0].user_id;
  var query = {};
  query[name] = value;
  // originally intended to include a feature to link different social accounts,
  //never got that far.
  userModel.findOne(
      query,
      function(err, doc) {
          if (doc) {
              user.mongoID = doc['_id'];
              callback(null, user);
          } else {
              var tempID = new ObjectID();
              user.mongoID = tempID;
              userModel.schema.methods.newUser(tempID, dataToSave);
              callback(null, user);
          }
      });
      
});


router.get('/',
    passport.authenticate('auth0', {}),
    function(req, res) {
        res.redirect("/");
    });

router.get('/callback',
    passport.authenticate('auth0', {
        failureRedirect: '/login'
    }),
    function(req, res) {
        if (!req.user) {
            throw new Error('user null');
        }
        res.redirect("/");
    }
);


module.exports = router;
