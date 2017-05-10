var update = {};
var mongoose = require("mongoose");
var resource = require("../models/resourceModel");
var user = require("../models/userModel");

update.pushResource = function(userID, statusToPushTo, dateField, resourceID) {
  return new Promise(function(resolve, reject) {
    var tempDate = new Date();
    user.findOneAndUpdate(
      {
        _id: userID
      },
      {
        $push: {
          [statusToPushTo]: {
            resourceID: resourceID,
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
      }
    );
  });
};

update.updateResourceStatus = function(
  userID,
  statusToPushTo,
  statusToPullFrom,
  dateField,
  resourceID
) {
  return new Promise(function(resolve, reject) {
    var tempDate = new Date();
    user.findOneAndUpdate(
      {
        _id: userID
      },
      {
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
        } else if (doc) {
          resolve(doc);
        }
      }
    );
  });
};

module.exports = update;
