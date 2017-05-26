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
var moment = require("moment");
router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

router.get("/:id", function(req, res) {
  if (req.isAuthenticated()) {
    var resourceProm = getResource(req.params.id);
    var userProm = getUserDataForResource(req.params.id, req.user.mongoID);
    Promise.all([resourceProm, userProm]).then((responses, error) => {
      var resourseStatusForUser = "...";
      if (responses[1] != "Not_Found") {
        var resourseStatusForUser = findResourceStatus(
          responses[1],
          req.params.id
        );
      }
      var usersResourceRating;
      for (let i = 0; i < responses[0].resourceRatings.length; i++) {
        if (responses[0].resourceRatings[i].ratedBy == req.user.mongoID) {
          usersResourceRating = responses[0].resourceRatings[i].rating;
        }
      }
      res.render("view-resource", {
        isUserAuthenticated: req.isAuthenticated(),
        resource: responses[0],
        user: responses[1],
        userID: req.user.mongoID,
        resourseStatusForUser: resourseStatusForUser,
        resourceRatingForUser: usersResourceRating,
        moment: moment
      });
    });
  } else {
    getResource(req.params.id).then((response, error) => {
      res.render("view-resource", {
        isUserAuthenticated: req.isAuthenticated(),
        resource: response,
        user: null,
        userID: null,
        moment: moment
      });
    });
  }
});

router.post("/", function(req, res) {
  var comment = req.body.comment;
  if (comment.length <= 3) {
    req.flash(
      "error",
      "You can't leave an empty comment!\nClick anywhere to close."
    );
    res.redirect("back");
  } else if (comment.length >= 140) {
    req.flash(
      "error",
      "You can't leave a comment over 140 characters!\nClick anywhere to close."
    );
    res.redirect("back");
  } else {
    getUser(req.user.mongoID).then((response, error) => {
      pushCommentToResource(
        req.body.resourceID,
        comment,
        response.firstName,
        response.cohort
      );
      res.redirect("back");
    });
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
      res.redirect("back");
    });
});

router.post("/change", function(req, res) {
  var newResourceStatus = req.body.resourceStatus;

  getUserDataForResource(
    req.body.resourceID,
    req.user.mongoID
  ).then((response, error) => {
    var resourceStatus, dateField;

    if (newResourceStatus == "Completed") {
      resourceStatus = "resourcesCompleted";
      dateField = "dateCompleted";
    } else if (newResourceStatus == "toDo") {
      resourceStatus = "resourcesToDo";
      dateField = "dateAdded";
    } else if (newResourceStatus == "inProgress") {
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
      var oldResourceStatus = findResourceStatus(response, req.body.resourceID);
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
        if(newResourceStatus != "clear") {
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
        } else if(newResourceStatus == "clear") {
          updateStatus
            .removeResourceStatus(
              req.user.mongoID,
              oldResourceStatus,
              req.body.resourceID
            )
            .then((response, error) => {
              res.redirect("back");
            });
        }
      }
    }
  });
});

router.post("/link", function(req, res) {
  reportBrokenLink(req.body.resourceID, req.user.mongoID).then((response, error) => {
    if (response == "DUPLICATE") {
      req.flash(
        "error",
        "You already reported this broken link!\nClick anywhere to close."
      );
      res.redirect("back");
    } else if (response == "REPORTED") {
      req.flash(
        "success",
        "Success!\nThanks for reporting the broken link.\nClick anywhere to close."
      );
      res.redirect("back");
    } else {
      req.flash("error", "Resource was not deleted\nClick anywhere to close.");
      res.redirect("back");
    }
  });
});

router.post("/inappropriate", function(req, res) {
  reportInappropriateLink(req.body.resourceID, req.user.mongoID).then((response, error) => {
    if (response == "DUPLICATE") {
      req.flash(
        "error",
        "You already reported this link as inappropriate!\nClick anywhere to close."
      );
      res.redirect("back");
    } else if (response == "REPORTED") {
      req.flash(
        "success",
        "Success!\nThanks for reporting the inappropriate link.\nClick anywhere to close."
      );
      res.redirect("back");
    } else {
      req.flash("error", "Report was not saved, please try again later.\nClick anywhere to close.");
      res.redirect("back");
    }
  });
});

function findResourceStatus(data, id) {
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

function getUserDataForResource(id, userID) {
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

function pushCommentToResource(id, comment, userName, cohort) {
  return new Promise(function(resolve, reject) {
    resource.findOneAndUpdate(
      {
        _id: id
      },
      {
        $push: {
          resourceComments: {
            comment: comment,
            commentID: new ObjectID(),
            commentBy: userName,
            commenterCohort: cohort,
            dateWritten: new Date()
          }
        }
      },
      {
        upsert: "true"
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

function reportBrokenLink(id, user) {
  return new Promise(function(resolve, reject) {
    resource.findOne(
      {
        _id: id
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else {
          if (doc.resourceFlaggedBrokenLink.includes(user)) {
            resolve("DUPLICATE");
          } else {
            resource.findOneAndUpdate(
              {
                _id: id
              },
              {
                $push: {
                  resourceFlaggedBrokenLink: user
                }
              },
              function(err, doc) {
                if (err) {
                  reject(err);
                } else {
                  resolve("REPORTED");
                }
              }
            );
          }
        }
      }
    );
  });
}

function reportInappropriateLink(id, user) {
  return new Promise(function(resolve, reject) {
    resource.findOne(
      {
        _id: id
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else {
          if (doc.resourceFlaggedInappropriate.includes(user)) {
            resolve("DUPLICATE");
          } else {
            resource.findOneAndUpdate(
              {
                _id: id
              },
              {
                $push: {
                  resourceFlaggedInappropriate: user
                }
              },
              function(err, doc) {
                if (err) {
                  reject(err);
                } else {
                  resolve("REPORTED");
                }
              }
            );
          }
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
