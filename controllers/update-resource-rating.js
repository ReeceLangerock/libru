var update = {}
var mongoose = require('mongoose');
var resource = require('../models/resourceModel');
var user = require('../models/userModel');

update.updateResourceRating = function(id, userID, rating) {
    return new Promise(function(resolve, reject) {
        resource.findOneAndUpdate({
                _id: id,
                'resourceRatings.ratedBy': userID
            }, {
                $set: {
                    'resourceRatings.$.ratedBy': userID,
                    'resourceRatings.$.rating': rating

                }
            },

            function(err, doc) {
                if (err) {
                    console.log(err)
                    reject(err);
                } else if (doc) {
                    console.log(doc);
                    resolve(doc);
                } else {
                    console.log('else')
                    resource.findOneAndUpdate({
                            _id: id,
                        }, {
                            $push: {
                                'resourceRatings': {
                                    ratedBy: userID,
                                    rating: rating
                                }
                            }
                        }, {
                            upsert: 'true'
                        },
                        function(err, doc) {
                            if (err) {
                                console.log(err)
                                reject(err);
                            } else if (doc) {
                                console.log(doc);
                                resolve(doc);
                            };
                        })

                };

            });
    });
}

update.filterOutCurrentUserRating = function(resources, userID) {

    for (let i = 0; i < resources.length; i++) {
        for (let j = 0; j < resources[i].resourceRatings.length; j++) {
            if (resources[i].resourceRatings[j].ratedBy == userID) {
                resources[i].rating = resources[i].resourceRatings[j].rating;

            }
        }
    }
    return resources;
}

module.exports = update;
