//SETUP ROUTER
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var user = require("../models/userModel");
var resource = require("../models/resourceModel");
var categoryList = require("../models/categoryList.json");
router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

router.get("/", function(req, res) {
  getUser(req.user.mongoID).then((response, error) => {

    getUsersResources(req.user.mongoID).then((response, error) => {
      res.render("user-profile", {
        isUserAuthenticated: req.isAuthenticated(),
        resources: response,
        categoryList: categoryList
      });
    });
  });
});

function getUser(userID) {
  return new Promise(function(resolve, reject) {
    user.findOne(
      {
        _id: userID
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      }
    );
  });
}

function getUsersResources(user) {
  return new Promise(function(resolve, reject) {
    resource
      .find({
        resourceAddedBy: user
      })
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(doc);
        }
      });
  });
}

module.exports = router;
