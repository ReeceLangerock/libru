//SETUP ROUTER
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var resource = require('../models/resourceModel');
var user = require('../models/userModel');
var updateRating = require('./update-resource-rating');
var updateStatus = require('./update-resource-status');
var bodyParser = require('body-parser');
var categoryList = require('../models/categoryList.json')
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

// This accepts all posts requests!
router.get('/', function(req, res) {
    getAllResources().then((response, error) => {
        if (req.isAuthenticated()) {
            var resources = updateRating.filterOutCurrentUserRating(response, req.user.mongoID);

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

    if (req.body.category == "All") {

        resourceQueryPromise = getAllResources();
    } else if (req.body.category === req.body.subcategory) {
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
            resources = updateRating.filterOutCurrentUserRating(response, req.user.mongoID);

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
    updateRating.updateResourceRating(req.body.resourceID, req.user.mongoID, req.body.resourceRating).then((response, error) => {
        res.end();
    });

})

router.post('/status', function(req, res) {

    var newResourceStatus = req.body.resourceStatus;

    getUserWithStatus(req.body.resourceID, req.user.mongoID).then((response, error) => {

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
            updateStatus.pushResource(req.user.mongoID, resourceStatus, dateField, req.body.resourceID).then((response, error) => {
                console.log("Added");
                res.end();
            })
        } else {
            var oldResourceStatus = findResourceStatusForPost(response, req.body.resourceID);
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
                updateStatus.updateResourceStatus(req.user.mongoID, resourceStatus, oldResourceStatus, dateField, req.body.resourceID).then((response, error) => {

                    res.end();
                });
            }
        }
    });
})

function findResourceStatusForPost(data, id) {
  for (let i = 0; i < data.resourcesCompleted.length; i++) {
      if (data.resourcesCompleted[i].resourceID == id) {
          return "Completed"
      }
  }

  for (let i = 0; i < data.resourcesToDo.length; i++) {
      if (data.resourcesToDo[i].resourceID == id) {
          return "Want To Do"
      }
  }

  for (let i = 0; i < data.resourcesInProgress.length; i++) {
      if (data.resourcesInProgress[i].resourceID == id) {
          return "In Progress"
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
