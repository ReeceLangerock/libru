//SETUP ROUTER
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var resource = require("../models/resourceModel");
var user = require("../models/userModel");
var updateRating = require("./update-resource-rating");
var updateStatus = require("./update-resource-status");
var bodyParser = require("body-parser");
var categoryList = require("../models/categoryList.json");
var moment = require("moment");
router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

router.get("/", function(req, res) {
  getAllPortfolios().then((response, error) => {
    if (req.isAuthenticated()) {
      // filter the resources returned from db to only include users ratings
      var resources = updateRating.filterOutCurrentUserRating(
        response,
        req.user.mongoID
      );

      getUser(req.user.mongoID).then((response, error) => {
        // filter the resources returned from db to only include users status
        for (let i = 0; i < resources.length; i++) {
          resources[i].status = findResourceStatus(
            response,
            resources[i]["_id"]
          );
        }
        // render page for authenticated user
        res.render("view-all-portfolios", {
          isUserAuthenticated: req.isAuthenticated(),
          resources: resources,
          categoryList: categoryList,
          moment: moment
        });
      });
    } else {
      // render page for un-authenticated user
      res.render("view-all-portfolios", {
        isUserAuthenticated: req.isAuthenticated(),
        resources: response,
        categoryList: categoryList,
        moment: moment
      });
    }
  });
});

// register update to users rating
router.post("/rate", function(req, res) {
  updateRating
    .updateResourceRating(
      req.body.resourceID,
      req.user.mongoID,
      req.body.resourceRating
    )
    .then((response, error) => {
      res.redirect("back");
    });
});

// register update to users status for the resource, not currently included on page
router.post("/status", function(req, res) {
  var newResourceStatus = req.body.resourceStatus;

  getUserWithStatus(
    req.body.resourceID,
    req.user.mongoID
  ).then((response, error) => {
    var resourceStatus, dateField;

    if (newResourceStatus == "Completed") {
      resourceStatus = "resourcesCompleted";
      dateField = "dateCompleted";
    } else if (newResourceStatus == "Want To Do") {
      resourceStatus = "resourcesToDo";
      dateField = "dateAdded";
    } else if (newResourceStatus == "In Progress") {
      resourceStatus = "resourcesInProgress";
      dateField = "dateStarted";
    }

    if (response == "Not_Found") {
      updateStatus
        .pushResource(
          req.user.mongoID,
          resourceStatus,
          dateField,
          req.body.resourceID
        )
        .then((response, error) => {
          res.redirect("back");
        });
    } else {
      var oldResourceStatus = findResourceStatusForPost(
        response,
        req.body.resourceID
      );
      if (newResourceStatus == oldResourceStatus) {
        res.redirect("back");
      } else {
        if (oldResourceStatus == "Completed") {
          oldResourceStatus = "resourcesCompleted";
        } else if (oldResourceStatus == "Want To Do") {
          oldResourceStatus = "resourcesToDo";
        } else if (oldResourceStatus == "In Progress") {
          oldResourceStatus = "resourcesInProgress";
        }
        updateStatus
          .updateResourceStatus(
            req.user.mongoID,
            resourceStatus,
            oldResourceStatus,
            dateField,
            req.body.resourceID
          )
          .then((response, error) => {
            res.redirect("back");
          });
      }
    }
  });
});

function findResourceStatusForPost(data, id) {
  for (let i = 0; i < data.resourcesCompleted.length; i++) {
    if (data.resourcesCompleted[i].resourceID == id) {
      return "Completed";
    }
  }

  for (let i = 0; i < data.resourcesToDo.length; i++) {
    if (data.resourcesToDo[i].resourceID == id) {
      return "Want To Do";
    }
  }

  for (let i = 0; i < data.resourcesInProgress.length; i++) {
    if (data.resourcesInProgress[i].resourceID == id) {
      return "In Progress";
    }
  }
}

function findResourceStatus(data, id) {
  for (let i = 0; i < data.resourcesCompleted.length; i++) {
    if (data.resourcesCompleted[i].resourceID == id) {
      return ["Completed", "In Progress", "Want To Do"];
    }
  }

  for (let i = 0; i < data.resourcesToDo.length; i++) {
    if (data.resourcesToDo[i].resourceID == id) {
      return ["Want To Do", "Completed", "In Progress"];
    }
  }

  for (let i = 0; i < data.resourcesInProgress.length; i++) {
    if (data.resourcesInProgress[i].resourceID == id) {
      return ["In Progress", "Completed", "Want To Do"];
    }
  }
  return ["Status", "Completed", "In Progress", "Want To Do"];
}

function getResourceCategory(category, categoryQuery) {
  return new Promise(function(resolve, reject) {
    resource
      .find({
        [categoryQuery]: category
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

function getAllPortfolios() {
  return new Promise(function(resolve, reject) {
    resource.find({ resourceCategory: "Portfolio" }).exec(function(err, doc) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        resolve(doc);
      }
    });
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
          console.log(err);
          reject(err);
        } else {
          resolve(doc);
        }
      }
    );
  });
}

function getUserWithStatus(id, userID) {
  return new Promise(function(resolve, reject) {
    user.findOne(
      {
        _id: userID,
        $or: [
          {
            "resourcesToDo.resourceID": id
          },
          {
            "resourcesInProgress.resourceID": id
          },
          {
            "resourcesCompleted.resourceID": id
          }
        ]
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else if (doc) {
          resolve(doc);
        } else {
          resolve("Not_Found");
        }
      }
    );
  });
}

module.exports = router;
