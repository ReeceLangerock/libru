//SETUP ROUTER
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var user = require('../models/userModel');
var resource = require('../models/resourceModel');
var updateRating = require('./update-resource-rating');
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

// This accepts all posts requests!
router.get('/', function(req, res) {

    getUser(req.user.mongoID).then((response, error) => {

        var resourcesCompletedToGet = [];
        var resourcesToDoToGet = [];
        var resourcesInProgressToGet = [];
        for (let i = 0; i < response.resourcesToDo.length; i++) {
            resourcesCompletedToGet.push(response.resourcesToDo[i].resourceID);
        }
        for (let i = 0; i < response.resourcesCompleted.length; i++) {
            resourcesToDoToGet.push(response.resourcesCompleted[i].resourceID);
        }
        for (let i = 0; i < response.resourcesInProgress.length; i++) {
            resourcesInProgressToGet.push(response.resourcesInProgress[i].resourceID);
        }

        var completedProm = getAllResources(resourcesCompletedToGet);
        var ToDoProm = getAllResources(resourcesToDoToGet);
        var InProgressProm = getAllResources(resourcesInProgressToGet);


        Promise.all([completedProm, ToDoProm, InProgressProm]).then((responses, error) => {
            for(let i = 0; i < responses[0].length; i++){
              responses[0][i].status = "Completed";
              responses[0][i].secondStatus = "Want To Do";
              responses[0][i].thirdStatus = "In Progress";
            }
            for(let i = 0; i < responses[1].length; i++){
              responses[1][i].status = "To Do";
              responses[1][i].secondStatus = "Completed";
              responses[1][i].thirdStatus = "In Progress";
            }
            for(let i = 0; i < responses[2].length; i++){
              responses[2][i].status = "In Progress";
              responses[2][i].secondStatus = "Completed";
              responses[2][i].thirdStatus = "Want To Do";
            }
            responses[0] = updateRating.filterOutCurrentUserRating(responses[0], req.user.mongoID);
            responses[1] = updateRating.filterOutCurrentUserRating(responses[1], req.user.mongoID);
            responses[2] = updateRating.filterOutCurrentUserRating(responses[2], req.user.mongoID);
            res.render('user-resources', {
                isUserAuthenticated: req.isAuthenticated(),
                completedResources: responses[0],
                toDoResources: responses[1],
                inProgressResources: responses[2],
            });
        })



    })


});

function getUser(userID) {
    return new Promise(function(resolve, reject) {
        user.findOne({
            _id: userID
        }, function(err, doc) {
            if (err) {
                reject(err);
            } else {

                resolve(doc);
            }
        });

    });
}

function getAllResources(resourceID) {
    return new Promise(function(resolve, reject) {
        resource.find({
          _id: {
              $in: resourceID
          }
        }, function(err, doc) {
            if (err) {
                reject(err);
            } else {

              console.log(doc);
                resolve(doc);
            }
        });

    });
}




module.exports = router;
