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
    } else {
      res.render("view-access-denied", {
        isUserAuthenticated: req.isAuthenticated()
      });
  }
  });
});

router.post("/delete", function(req, res) {
  deleteResource(req.body.id).then((response, error) => {
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
  // if the user changed the url in there edit, make sure it's not to an existing resource url
  if (req.body.currentURLAddress != req.body.resourceURL) {
    // User can enter http or https url, this creates a sting to search if either case has been added previously
    var re = new RegExp("^(https)://", "i");
    var isHTTPS = re.test(req.body.resourceURL);
    var emptyUrl;
    if (isHTTPS) {
      emptyUrl = req.body.resourceURL.substring(5);
    } else {
      emptyUrl = req.body.resourceURL.substring(4);
    }
    var httpUrl = "http" + emptyUrl;
    var httpsUrl = "https" + emptyUrl;
    checkIfResourceAlreadyAdded(
      httpUrl, httpsUrl
    ).then((response, error) => {
      if (response == "NOT_ADDED") {
        // if the resource url is being changed, clear out the reports of broken link
        resourceFlaggedBy = [];
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
  } else {
    // if the resource url is being changed, leave any reports of broken link or empty array if none existing
    resourceFlaggedBy = req.body.resourceFlaggedBy || [];
    editResource(req.body).then((response, error) => {
      req.flash("success", "Resource edited!\nClick anywhere to close.");
      res.redirect("back");
    });
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

function editResource(data, resourceFlaggedBy) {
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
          resourceGoesOnSale: data.resourceGoesOnSale,
          resourceFlaggedBy: resourceFlaggedBy
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

function checkIfResourceAlreadyAdded(httpUrl, httpsUrl) {
  return new Promise(function(resolve, reject) {
    resource.findOne(
      {
        $or: [{ resourceURL: httpUrl }, { resourceURL: httpsUrl }]
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
