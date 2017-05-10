//SETUP ROUTER
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var resource = require("../models/resourceModel");
var categoryList = require("../models/categoryList.json");
router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

// This accepts all posts requests!
router.get("/", function(req, res) {
  res.render("add-resource", {
    isUserAuthenticated: req.isAuthenticated(),
    categoryList: categoryList
  });
});

router.post("/submit", (req, res) => {

  checkIfResourceAlreadyAdded(req.body.resourceUrl).then((response, error) => {
    if (response == "NOT_ADDED") {
      if(!req.body.resourceSubCategory) {
        req.body.resourceSubCategory = req.body.resourceCategory
      }

      resource.schema.methods.newResource(req.body, req.user.mongoID);
      req.flash("success", "Resource added!\nClick anywhere to close.");
      res.redirect("back");
    } else {
      req.flash(
        "error",
        "This resource has already been added!\nClick anywhere to close."
      );
      res.redirect("back");
    }
  });
});

function checkIfResourceAlreadyAdded(url) {
  console.log(url);
  return new Promise(function(resolve, reject) {
    resource.findOne(
      {
        resourceURL: url
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else if (doc) {
          console.log(doc);
          resolve(doc);
        } else {
          console.log("not added");
          resolve("NOT_ADDED");
        }
      }
    );
  });
}

module.exports = router;
