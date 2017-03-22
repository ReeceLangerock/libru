//SETUP ROUTER
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var user = require('../models/userModel');
var resource = require('../models/resourceModel');
var ObjectID = require('mongodb').ObjectID;
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

router.get('/:id', function(req, res) {



    if (req.isAuthenticated()) {
        var resourceProm = getResource(req.params.id);
        var userProm = getUser(req.params.id, req.user.mongoID);
        Promise.all([resourceProm, userProm]).then((responses, error) => {
            var resourseStatusForUser = "..."
            if (responses[1] != "Not_Found") {
                var resourseStatusForUser = findResourceStatus(responses[1], req.params.id);
            }
            var usersResourceRating;
            for(let i =0; i < responses[0].resourceRatings.length; i++){
              if(responses[0].resourceRatings[i].ratedBy == req.user.mongoID){
                usersResourceRating = responses[0].resourceRatings[i].rating;
              }
            }
            res.render('resource', {
                isUserAuthenticated: req.isAuthenticated(),
                resource: responses[0],
                user: responses[1],
                resourseStatusForUser: resourseStatusForUser,
                resourceRatingForUser: usersResourceRating
            });
        });
    } else {
        getResource(req.params.id).then((response, error) => {

            res.render('resource', {
                isUserAuthenticated: req.isAuthenticated(),
                resource: response
            });
        });

    }
})

router.post('/rate', function(req, res) {
    updateResourceRating(req.body.resourceID, req.user.mongoID, req.body.resourceRating).then((response, error) => {
      req.end();
    });

})

router.post('/change', function(req, res) {
    var newResourceStatus = req.body.resourceStatus;

    getUser(req.body.resourceID, req.user.mongoID).then((response, error) => {

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
            pushResource(req.user.mongoID, resourceStatus, dateField, req.body.resourceID).then((response, error) => {
                console.log("Added");
                res.end();
            })
        } else {
            var oldResourceStatus = findResourceStatus(response, req.body.resourceID);
            if (newResourceStatus == oldResourceStatus) {
                console.log("NO CHANGE");
                res.end();
            } else {
                console.log(oldResourceStatus);

                if (oldResourceStatus == "Completed") {
                    oldResourceStatus = "resourcesCompleted";
                } else if (oldResourceStatus == "Want To Do") {
                    oldResourceStatus = "resourcesToDo";
                } else if (oldResourceStatus == "In Progress") {
                  oldResourceStatus = "resourcesInProgress";
                }
                updateResourceStatus(req.user.mongoID, resourceStatus, oldResourceStatus, dateField, req.body.resourceID).then((response, error) => {

                    res.end();
                });
            }
        }
    });
})

function findResourceStatus(data, id) {

    for (let i = 0; i < data.resourcesCompleted.length; i++) {
        console.log("comp")
        if (data.resourcesCompleted[i].resourceID == id) {
            return "Completed";
        }
    }

    for (let i = 0; i < data.resourcesToDo.length; i++) {
        console.log("want")
        if (data.resourcesToDo[i].resourceID == id) {
            return "Want To Do";
        }
    }

    for (let i = 0; i < data.resourcesInProgress.length; i++) {
        console.log("prog")
        if (data.resourcesInProgress[i].resourceID == id) {
            return "In Progress";
        }
    }
}

function updateResourceRating(id, userID, rating){
  return new Promise(function(resolve, reject) {
      resource.findOneAndUpdate({
          _id: id
      }, {
        $push: {
          resourceRatings: {
            ratedBy: userID,
            rating: rating
          }
        }
      }, {upsert: 'true' }, function(err, doc) {
          if (err) {
              reject(err);
          } else {
              resolve(doc);
          }
      });

  });
}

function pushResource(userID, statusToPushTo, dateField, resourceID) {
    return new Promise(function(resolve, reject) {
        var tempDate = new Date();
        user.findOneAndUpdate({
                _id: userID
            }, {
                $push: {
                    [statusToPushTo]: {
                        'resourceID': resourceID,
                        [dateField]: tempDate
                    }
                }
            },
            function(err, doc) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doc);
                }
            });

    });
}

function updateResourceStatus(userID, statusToPushTo, statusToPullFrom, dateField, resourceID) {

    return new Promise(function(resolve, reject) {
        var tempDate = new Date();
        user.findOneAndUpdate({
                _id: userID
            }, {
                $push: {
                    [statusToPushTo]: {
                        resourceID: resourceID,
                        [dateField]: tempDate
                    }
                },

                $pull: {
                    [statusToPullFrom]: {
                        resourceID: resourceID
                    }
                }
            },
            function(err, doc) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else if(doc) {
                    console.log(doc);
                    resolve(doc);
                }
            });

    });
}

function getUser(id, userID) {
    return new Promise(function(resolve, reject) {
        user.findOne({
            _id: userID,
            $or: [{
                    "resourcesToDo.resourceID": id
                },
                {
                    "resourcesInProgress.resourceID": id
                },
                {
                    "resourcesCompleted.resourceID": id
                }
            ]

        }, function(err, doc) {
            if (err) {
                reject(err);
            } else if (doc) {
                resolve(doc);
            } else {
                console.log("Not_Found");
                resolve("Not_Found");
            }
        });

    });
}

function getResource(id) {
    return new Promise(function(resolve, reject) {
        resource.findOne({
            _id: id
        }, function(err, doc) {
            if (err) {
                reject(err);
            } else {
                resolve(doc);
            }
        });

    });
}

module.exports = router;
