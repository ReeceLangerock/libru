const mongoose = require("mongoose");
var ObjectID = require("mongodb").ObjectID;

var userSchema = mongoose.Schema({
  _id: String,
  firstName: String,
  lastName: String,
  fbID: String,
  githubID: String,
  auth0ID: String,
  cohort: String,
  displayName: String,
  resourcesSubmitted: [String],
  resourcesCompleted: [
    {
      resourceID: String,
      dateCompleted: Date,
      dateStarted: Date,
      _id: false
    }
  ],
  resourcesToDo: [
    {
      resourceID: String,
      dateAdded: Date,
      _id: false
    }
  ],
  resourcesInProgress: [
    {
      resourceID: String,
      dateStarted: Date,
      _id: false
    }
  ],
  comments: [
    {
      commentText: String,
      dateWritten: Date
    }
  ]
});

userSchema.methods.newUser = function(id, data) {
  var newUser = new userModel({
    _id: id,
    firstName: data.firstName,
    lastName: data.lastName,
    fbID: data.fbID,
    githubID: data.githubID,
    auth0ID: data.auth0ID,
    cohort: "none",
    displayName: data.firstName,
    resourcesSubmitted: [],
    resourcesCompleted: [
      {
        resourceID: "",
        dateCompleted: "",
        dateStarted: "",
        _id: false
      }
    ],
    resourcesToDo: [
      {
        resourceID: "",
        dateAdded: "",
        _id: false
      }
    ],
    resourcesInProgress: [
      {
        resourceID: "",
        dateStarted: "",
        _id: false
      }
    ],
    comments: []
  });

  newUser.save(function(err) {
    if (err) {
      throw err;
    } else {
      return "success";
    }
  });
};

var userModel = mongoose.model("user", userSchema, "users");
module.exports = userModel;
