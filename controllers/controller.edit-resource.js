//SETUP ROUTER
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var user = require("../models/userModel");
var updateRating = require("./update-resource-rating");
var updateStatus = require("./update-resource-status");
var resource = require("../models/resourceModel");
var ObjectID = require("mongodb").ObjectID;
var categoryList = require("../models/categoryList.json");
router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

router.get("/:id", function(req, res) {
  getResource(req.params.id).then((response, error) => {
      console.log(response);
    if ((response.resourceAddedBy = req.user.mongoID)) {
      res.render("edit-resource", {
        isUserAuthenticated: req.isAuthenticated(),
        resource: response,
        categoryList: categoryList
      });
    }
  });
});

router.post("/delete", function(req, res) {
  console.log(req.body.id);
  deleteResource(req.body.id).then((response, error) => {
    res.end();
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

function deleteResource(id) {
  return new Promise(function(resolve, reject) {
    resource.remove(
      {
        _id: id
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else {
          console.log("removing");
          resolve(doc);
        }
      }
    );
  });
}

function getResource(id) {
  return new Promise(function(resolve, reject) {
    resource.findOne(
      {
        _id: id
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
