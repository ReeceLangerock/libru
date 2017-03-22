//SETUP ROUTER
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var resource = require('../models/resourceModel');
var user = require('../models/userModel');
var update = require('./update-resource-status');
var bodyParser = require('body-parser');
var categoryList = require('../models/categoryList.json')
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

// This accepts all posts requests!
router.get('/', function(req, res) {
    update.test();
    getAllResources().then((response, error) => {
        if (req.isAuthenticated()) {
            var resources = filterOutCurrentUserMetadata(response, req.user.mongoID);
            getUser(req.user.mongoID).then((response, error) => {
                for (let i = 0; i < resources.length; i++) {
                    resources[i].status = findResourceStatus(response, resources[i]['_id'])
                }


                res.render('all-resources', {
                    isUserAuthenticated: req.isAuthenticated(),
                    resources: resources,
                    categoryList: categoryList
                });

            })


        } else {
            res.render('all-resources', {
                isUserAuthenticated: req.isAuthenticated(),
                resources: response,
                categoryList: categoryList
            });

        }
    })

});

router.post('/', (req, res) => {

    var resources, category, categoryQuery, resourceQueryPromise;

    if(req.body.category == "All"){

      resourceQueryPromise = getAllResources();
    }
    else if (req.body.category === req.body.subcategory) {
        category = req.body.category;
        categoryQuery = "resourceCategory";
        resourceQueryPromise = getResourceCategory(category, categoryQuery);
    } else {
        category = req.body.subcategory;
        categoryQuery = "resourceSubCategory";
        resourceQueryPromise = getResourceCategory(category, categoryQuery);
    }

    resourceQueryPromise.then((response, error) => {

        if (req.isAuthenticated()) {
            resources = filterOutCurrentUserMetadata(response, req.user.mongoID);
            console.log(resources.length);
            getUser(req.user.mongoID).then((response, error) => {
                for (let i = 0; i < resources.length; i++) {
                    resources[i].status = findResourceStatus(response, resources[i]['_id'])
                    console.log(resources[i].status);

                }

                res.render('all-resources', {
                    isUserAuthenticated: req.isAuthenticated(),
                    resources: resources,
                    categoryList: categoryList
                });
            })

        } else {
            resources = response;
            res.render('all-resources', {
                isUserAuthenticated: req.isAuthenticated(),
                resources: resources,
                categoryList: categoryList
            });
        }

    });
})

router.post('/rate', function(req, res) {
    updateResourceRating(req.body.resourceID, req.user.mongoID, req.body.resourceRating).then((response, error) => {
      req.end();
    });

})

router.post('/status', function(req, res) {
    console.log(req.body);
    var newResourceStatus = req.body.resourceStatus;

    getUserWithStatus(req.body.resourceID, req.user.mongoID).then((response, error) => {

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

function filterOutCurrentUserMetadata(resources, userID) {

    for (let i = 0; i < resources.length; i++) {
        for (let j = 0; j < resources[i].resourceRatings.length; j++) {
            if (resources[i].resourceRatings[j].ratedBy == userID) {
                resources[i].rating = resources[i].resourceRatings[j].rating;

            }
        }
    }
    return resources;
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

function getResourceCategory(category, categoryQuery) {
    return new Promise(function(resolve, reject) {
        resource.find({
            [categoryQuery]: category
        }).exec(
            function(err, doc) {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {

                    resolve(doc);
                }
            });

    });
}


function getAllResources() {
    return new Promise(function(resolve, reject) {
        resource.find({}).exec(
            function(err, doc) {
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
        user.findOne({
            _id: userID
        }, function(err, doc) {
            if (err) {
                console.log(err);
                reject(err);
            } else {

                resolve(doc);
            }
        });

    });
}

function getUserWithStatus(id, userID) {
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

module.exports = router;
