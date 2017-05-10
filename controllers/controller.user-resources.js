//SETUP ROUTER
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var user = require("../models/userModel");
var resource = require("../models/resourceModel");
var categoryList = require("../models/categoryList");
var updateRating = require("./update-resource-rating");
var updateStatus = require("./update-resource-status");
var moment = require("moment");
router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

// This accepts all posts requests!
router.get("/", function(req, res) {
  if (req.isAuthenticated) {
    getUser(req.user.mongoID).then((response, error) => {
      var resourcesCompletedToGet = [];
      var resourcesToDoToGet = [];
      var resourcesInProgressToGet = [];
      for (let i = 0; i < response.resourcesCompleted.length; i++) {
        resourcesCompletedToGet.push(response.resourcesCompleted[i].resourceID);
      }
      for (let i = 0; i < response.resourcesToDo.length; i++) {
        resourcesToDoToGet.push(response.resourcesToDo[i].resourceID);
      }
      for (let i = 0; i < response.resourcesInProgress.length; i++) {
        resourcesInProgressToGet.push(
          response.resourcesInProgress[i].resourceID
        );
      }

      var completedProm = getAllResources(resourcesCompletedToGet);
      var ToDoProm = getAllResources(resourcesToDoToGet);
      var InProgressProm = getAllResources(resourcesInProgressToGet);

      Promise.all([
        completedProm,
        ToDoProm,
        InProgressProm
      ]).then((responses, error) => {
        for (let i = 0; i < responses[0].length; i++) {
          responses[0][i].status = "Completed";
          responses[0][i].secondStatus = "Want To Do";
          responses[0][i].thirdStatus = "In Progress";
        }
        for (let i = 0; i < responses[1].length; i++) {
          responses[1][i].status = "Want To Do";
          responses[1][i].secondStatus = "Completed";
          responses[1][i].thirdStatus = "In Progress";
        }
        for (let i = 0; i < responses[2].length; i++) {
          responses[2][i].status = "In Progress";
          responses[2][i].secondStatus = "Completed";
          responses[2][i].thirdStatus = "Want To Do";
        }
        responses[0] = updateRating.filterOutCurrentUserRating(
          responses[0],
          req.user.mongoID
        );
        responses[1] = updateRating.filterOutCurrentUserRating(
          responses[1],
          req.user.mongoID
        );
        responses[2] = updateRating.filterOutCurrentUserRating(
          responses[2],
          req.user.mongoID
        );
        res.render("view-user-resources", {
          isUserAuthenticated: req.isAuthenticated(),
          completedResources: responses[0],
          toDoResources: responses[1],
          inProgressResources: responses[2],
          categoryList: categoryList,
          moment: moment
        });
      });
    });
  } else {
    res.render("view-access-denied");
  }
});

router.post("/", function(req, res) {
  if (req.isAuthenticated) {
    getUser(req.user.mongoID).then((response, error) => {
      var resourcesCompletedToGet = [];
      var resourcesToDoToGet = [];
      var resourcesInProgressToGet = [];
      for (let i = 0; i < response.resourcesCompleted.length; i++) {
        resourcesCompletedToGet.push(response.resourcesCompleted[i].resourceID);
      }
      for (let i = 0; i < response.resourcesToDo.length; i++) {
        resourcesToDoToGet.push(response.resourcesToDo[i].resourceID);
      }
      for (let i = 0; i < response.resourcesInProgress.length; i++) {
        resourcesInProgressToGet.push(
          response.resourcesInProgress[i].resourceID
        );
      }

      var resources,
        category,
        categoryQuery,
        completedProm,
        ToDoProm,
        InProgressProm;

      if (req.body.category == "All") {
        completedProm = getAllResourcesByCategory(resourcesCompletedToGet);
        ToDoProm = getAllResourcesByCategory(resourcesToDoToGet);
        InProgressProm = getAllResourcesByCategory(resourcesInProgressToGet);
      } else if (req.body.category === req.body.subcategory) {
        category = req.body.category;
        categoryQuery = "resourceCategory";
        completedProm = getAllResourcesByCategory(
          resourcesCompletedToGet,
          category,
          categoryQuery
        );
        ToDoProm = getAllResourcesByCategory(
          resourcesToDoToGet,
          category,
          categoryQuery
        );
        InProgressProm = getAllResourcesByCategory(
          resourcesInProgressToGet,
          category,
          categoryQuery
        );
      } else {
        category = req.body.subcategory;
        categoryQuery = "resourceSubCategory";
        completedProm = getAllResourcesByCategory(
          resourcesCompletedToGet,
          category,
          categoryQuery
        );
        ToDoProm = getAllResourcesByCategory(
          resourcesToDoToGet,
          category,
          categoryQuery
        );
        InProgressProm = getAllResourcesByCategory(
          resourcesInProgressToGet,
          category,
          categoryQuery
        );
      }

      Promise.all([
        completedProm,
        ToDoProm,
        InProgressProm
      ]).then((responses, error) => {
        for (let i = 0; i < responses[0].length; i++) {
          responses[0][i].status = "Completed";
          responses[0][i].secondStatus = "Want To Do";
          responses[0][i].thirdStatus = "In Progress";
        }
        for (let i = 0; i < responses[1].length; i++) {
          responses[1][i].status = "Want To Do";
          responses[1][i].secondStatus = "Completed";
          responses[1][i].thirdStatus = "In Progress";
        }
        for (let i = 0; i < responses[2].length; i++) {
          responses[2][i].status = "In Progress";
          responses[2][i].secondStatus = "Completed";
          responses[2][i].thirdStatus = "Want To Do";
        }
        responses[0] = updateRating.filterOutCurrentUserRating(
          responses[0],
          req.user.mongoID
        );
        responses[1] = updateRating.filterOutCurrentUserRating(
          responses[1],
          req.user.mongoID
        );
        responses[2] = updateRating.filterOutCurrentUserRating(
          responses[2],
          req.user.mongoID
        );
        res.render("view-user-resources", {
          isUserAuthenticated: req.isAuthenticated(),
          completedResources: responses[0],
          toDoResources: responses[1],
          inProgressResources: responses[2],
          categoryList: categoryList,
          moment: moment
        });
      });
    });
  } else {
    res.render("view-access-denied");
  }
});

router.post("/rate", function(req, res) {
  updateRating
    .updateResourceRating(
      req.body.resourceID,
      req.user.mongoID,
      req.body.resourceRating
    )
    .then((response, error) => {
      res.end();
    });
});

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
          res.end();
        });
    } else {
      var oldResourceStatus = findResourceStatusForPost(
        response,
        req.body.resourceID
      );

      if (newResourceStatus == oldResourceStatus) {
        res.end();
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
            res.end();
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

function getAllResources(resourceID) {
  return new Promise(function(resolve, reject) {
    resource.find(
      {
        _id: {
          $in: resourceID
        }
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

function getAllResourcesByCategory(resourceID, category, categoryQuery) {
  return new Promise(function(resolve, reject) {
    resource.find(
      {
        _id: {
          $in: resourceID
        },
        [categoryQuery]: category
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
