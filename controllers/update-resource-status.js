var update = {}
var mongoose = require('mongoose');
var resource = require('../models/resourceModel');
var user = require('../models/userModel');

    update.updateResourceRating = function(id, userID, rating) {
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
            }, {
                upsert: 'true'
            }, function(err, doc) {
                if (err) {
                    reject(err);
                } else {
                    resolve(doc);
                }
            });

        });
    }

    update.test = function() {
        console.log("test")
    }

module.exports = update;
