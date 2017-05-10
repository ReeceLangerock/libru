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
  if (req.params.id != "favicon.ico" && req.params.id != "null") {
    id = req.params.id;
  }
  getResource(id).then((response, error) => {
    if (response.resourceAddedBy == req.user.mongoID) {
      res.render("view-edit-resource", {
        isUserAuthenticated: req.isAuthenticated(),
        resource: response,
        categoryList: categoryList
      });
    }
  });
});

router.post("/delete", function(req, res) {
  console.log(req.body);
  deleteResource(req.body.id).then((response, error) => {
    console.log(response);
    if (response == "DELETED") {
      req.flash("success", "Resource deleted!\nClick anywhere to close.");
      res.redirect("./");
    } else {
      req.flash("error", "Resource was not deleted\nClick anywhere to close.");
      res.redirect("back");
    }
  });
});

router.post("/edit", function(req, res) {
  checkIfResourceAlreadyAdded(req.body.resourceUrl).then((response, error) => {
    if (response == "NOT_ADDED") {
      editResource(req.body).then((response, error) => {
        req.flash("success", "Resource edited!\nClick anywhere to close.");
        res.redirect("back");
      });
    } else {
      req.flash(
        "error",
        "This resource has already been added!\nClick anywhere to close."
      );
      res.redirect("back");
    }
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
    resource.findByIdAndRemove(
      {
        _id: id
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else {
          resolve("DELETED");
        }
      }
    );
  });
}

function editResource(data) {
  return new Promise(function(resolve, reject) {
    resource.findOneAndUpdate(
      {
        _id: data.id
      },
      {
        $set: {
          title: data.resourceTitle,
          resourceURL: data.resourceURL,
          resourceImageURL: data.resourceImageURL,
          resourceDescription: data.resourceDescription,
          resourceDifficulty: data.resourceDifficulty,
          resourceCategory: data.resourceCategory,
          resourceSubCategory: data.resourceSubCategory,
          resourceCost: data.resourceCost,
          resourceGoesOnSale: data.resourceGoesOnSale
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

function checkIfResourceAlreadyAdded(url) {
  return new Promise(function(resolve, reject) {
    resource.findOne(
      {
        resourceURL: url
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else if (doc) {
          resolve(doc);
        } else {
          resolve("NOT_ADDED");
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
