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

module.exports = update;
