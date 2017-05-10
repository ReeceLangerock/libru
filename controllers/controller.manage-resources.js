//SETUP ROUTER
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var user = require("../models/userModel");
var resource = require("../models/resourceModel");
var categoryList = require("../models/categoryList.json");
var moment = require("moment");
router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

router.get("/", function(req, res) {
  getUser(req.user.mongoID).then((response, error) => {
    getUsersResources(req.user.mongoID).then((response, error) => {
      res.render("view-manage-resources", {
        isUserAuthenticated: req.isAuthenticated(),
        resources: response,
        categoryList: categoryList,
        moment: moment
      });
    });
  });
});

router.post("/", (req, res) => {
  if (req.isAuthenticated()) {
    var resources, category, categoryQuery, resourceQueryPromise;
    console.log("BODY");
    console.log(req.body);

    if (req.body.category == "All") {
      resourceQueryPromise = getUsersResources();
    } else if (req.body.category === req.body.subcategory) {
      category = req.body.category;
      categoryQuery = "resourceCategory";
      resourceQueryPromise = getResourceCategory(
        category,
        categoryQuery,
        req.user.mongoID
      );
    } else {
      category = req.body.subcategory;
      categoryQuery = "resourceSubCategory";
      resourceQueryPromise = getResourceCategory(
        category,
        categoryQuery,
        req.user.mongoID
      );
    }

    resourceQueryPromise.then((response, error) => {
      res.render("view-manage-resources", {
        isUserAuthenticated: req.isAuthenticated(),
        resources: response,
        categoryList: categoryList,
        moment: moment
      });
    });
  } else {
    res.redirect("../");
  }
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

function getResourceCategory(category, categoryQuery, user) {
  console.log(category);
  console.log(categoryQuery);
  return new Promise(function(resolve, reject) {
    resource
      .find({
        resourceAddedBy: user,
        [categoryQuery]: category
      })
      .exec(function(err, doc) {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log(doc);
          resolve(doc);
        }
      });
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
