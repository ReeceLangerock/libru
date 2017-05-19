const mongoose = require("mongoose");
var ObjectID = require("mongodb").ObjectID;

var resourceSchema = mongoose.Schema({
  _id: String,
  dateAdded: Date,
  title: String,
  resourceURL: String,
  resourceImageURL: String,
  resourceDescription: String,
  resourceDifficulty: String,
  resourceCategory: String,
  resourceSubCategory: String,
  resourceCost: String,
  resourceGoesOnSale: Boolean,
  resourceRatings: [
    {
      ratedBy: String,
      rating: Number,
      _id: false
    }
  ],
  resourceComments: [
    {
      comment: String,
      commentID: String,
      commentBy: String,
      commenterCohort: String,
      dateWritten: Date,
      _id: false
    }
  ],
  resourceAddedBy: String,
  resourceFlaggedBrokenLink: [String],
  resourceFlaggedInappropriate: [String]
});

resourceSchema.methods.newResource = function(data, userID) {
  var goesOnSale = !data.resourceGoesOnSale ? false : data.resourceGoesOnSale;
  var newResource = new resourceModel({
    _id: new ObjectID(),
    dateAdded: new Date(),
    title: data.resourceTitle,
    resourceURL: data.resourceUrl,
    resourceImageURL: data.resourceImageUrl,
    resourceDescription: data.resourceDescription,
    resourceDifficulty: data.resourceDifficulty,
    resourceCategory: data.resourceCategory,
    resourceSubCategory: data.resourceSubCategory,
    resourceCost: data.resourceCost,
    resourceGoesOnSale: goesOnSale,
    resourceAddedBy: userID

  });

  newResource.save(function(err) {
    if (err) {
      throw err;
    } else {
      return "success";
    }
  });
};

var resourceModel = mongoose.model("resource", resourceSchema, "resources");
module.exports = resourceModel;
