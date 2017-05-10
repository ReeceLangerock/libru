//SETUP ROUTER
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var user = require("../models/userModel");
var resource = require("../models/resourceModel");
var cohortList = require("../models/cohortList");

router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

router.get("/", function(req, res) {
  if (req.isAuthenticated) {
    getUser(req.user.mongoID).then((response, error) => {
      res.render("view-user-settings", {
        isUserAuthenticated: req.isAuthenticated(),
        userData: response,
        cohortList: cohortList
      });
    });
  } else {
    res.render("view-access-denied");
  }
});

router.post("/", function(req, res) {
  if (req.isAuthenticated) {
    updateUser(req.user.mongoID, req.body).then((response, error) => {
      res.render("view-user-settings", {
        isUserAuthenticated: req.isAuthenticated(),
        userData: response,
        cohortList: cohortList
      });
    });
  } else {
    res.render("view-access-denied");
  }
});

function updateUser(userID, data) {
  return new Promise(function(resolve, reject) {
    user.findOneAndUpdate(
      {
        _id: userID
      },
      {
        $set: {
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName,
          cohort: data.cohortName
        }
      },
      function(err, doc) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve(doc);
        }
      }
    );
  });
}

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

module.exports = router;
