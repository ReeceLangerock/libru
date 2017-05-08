//SETUP ROUTER
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var resource = require("../models/resourceModel");
var user = require("../models/userModel");
var bodyParser = require("body-parser");
var categoryList = require("../models/categoryList.json");
var numResourcesToGet = 6;

router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

// This accepts all posts requests!
router.get("/", function(req, res) {
  var recentResourcesProm = getRecentResources();
  var popularResourcesProm = getPopularResources();
  var portfolioProm = getPortfolios();
  var userCountProm = getUserCount();
  var resurceCountProm = getResourceCount();

  Promise.all([
    popularResourcesProm,
    recentResourcesProm,
    portfolioProm,
    userCountProm,
    resurceCountProm
  ]).then((responses, error) => {
    var numbers = {
      resources: responses[4],
      categories: categoryList.length,
      users: responses[3]
    };
    res.render("index", {
      test: "TEST",
      isUserAuthenticated: req.isAuthenticated(),
      popularResources: responses[0],
      recentResources: responses[1],
      portfolios: responses[2],
      numbers: numbers
    });
  });
});

function getPortfolios() {
  return new Promise(function(resolve, reject) {
    resource
      .find({
        resourceCategory: "Portfolio"
      })
      .sort({
        dateAdded: -1
      })
      .limit(numResourcesToGet)
      .exec(function(err, doc) {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
  });
}

function getUserCount() {
  return new Promise(function(resolve, reject) {
    user.count({}, function(err, doc) {
      if (err) {
        reject(err);
      } else {
        console.log(doc);
        resolve(doc);
      }
    });
  });
}

function getResourceCount() {
  return new Promise(function(resolve, reject) {
    resource.count({}, function(err, doc) {
      if (err) {
        reject(err);
      } else {
        console.log(doc);
        resolve(doc);
      }
    });
  });
}

function getPopularResources() {
  return new Promise(function(resolve, reject) {
    resource
      .aggregate([
        {
          $project: {
            avgRating: {
              $avg: "$resourceRatings.rating"
            },
            title: "$title",
            resourceURL: "$resourceURL",
            resourceImageURL: "$resourceImageURL",
            resourceDescription: "$resourceDescription"
          }
        }
      ])
      .sort({
        avgRating: -1
      })
      .limit(numResourcesToGet)
      .exec(function(err, doc) {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
  });
}

function getRecentResources() {
  return new Promise(function(resolve, reject) {
    resource
      .find({})
      .sort({
        dateAdded: -1
      })
      .limit(numResourcesToGet)
      .exec(function(err, doc) {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
  });
}

module.exports = router;
