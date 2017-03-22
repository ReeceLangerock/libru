//SETUP ROUTER
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var resource = require('../models/resourceModel');
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

// This accepts all posts requests!
router.get('/', function(req, res) {

    var recentResourcesProm = getRecentResources();
    var popularResourcesProm = getPopularResources();

    Promise.all([popularResourcesProm, recentResourcesProm]).then((responses, error) => {

        res.render('index', {
            test: "TEST",
            isUserAuthenticated: req.isAuthenticated(),
            popularResources : responses[0],
            recentResources: responses[1]
        });
    })
});

function getPopularResources() {
    return new Promise(function(resolve, reject) {
        resource.aggregate([{
            $project: {
                avgRating: {
                    $avg: "$resourceRatings.rating"
                },
                title:  '$title',
                resourceURL: '$resourceURL',
                resourceImageURL: '$resourceImageURL',
                resourceDescription: '$resourceDescription'
            },
        }]).sort({
            avgRating: -1
        }).limit(3).exec(
            function(err, doc) {
                if (err) {
                    reject(err);
                } else {
                    
                    resolve(doc);
                }
            });

    });
}

function getRecentResources() {
    return new Promise(function(resolve, reject) {
        resource.find({}).sort({
            dateAdded: -1
        }).limit(3).exec(
            function(err, doc) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doc);
                }
            });

    });
}

module.exports = router;
