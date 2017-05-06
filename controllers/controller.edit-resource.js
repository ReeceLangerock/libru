//SETUP ROUTER
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var user = require("../models/userModel");
var updateRating = require("./update-resource-rating");
var updateStatus = require("./update-resource-status");
var resource = require("../models/resourceModel");
var ObjectID = require("mongodb").ObjectID;
var categoryList = require("../models/categoryList.json");
router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

router.get('/:id', function(req, res) {
  if(req.params.id != '/favicon.ico'){
    id = req.params.id
  }
  getResource(id).then((response, error) => {

    if ((response.resourceAddedBy == req.user.mongoID)) {
      res.render("edit-resource", {
        isUserAuthenticated: req.isAuthenticated(),
        resource: response,
        categoryList: categoryList
      });
    }
  });
});

router.post("/delete", function(req, res) {

  deleteResource(req.body.id).then((response, error) => {
    res.end();
  });
});

router.post("/edit", function(req, res){
  console.log("edit");
  console.log(req.body);
  res.redirect("back");
  /*editResource(req.body).then((response, error) => {
    res.end();
  });*/
})

function getUser(userID) {
  return new Promise(function(resolve, reject) {
    user.findOne(
      {
        _id: userID
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
}

function deleteResource(id) {
  return new Promise(function(resolve, reject) {
    resource.remove(
      {
        _id: id
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else {
          console.log("removing");
          resolve(doc);
        }
      }
    );
  });
}

function editResource(data){
  resource.findOne(
    {
      _id: data.id
    }, {
      $set: {
        "title": data.title,
        "resourceURL": data.resourceURL,
        "resourceImageURL": data.resourceImageURL,
        "resourceDescription": data.resourceDescription,
        "resourceDifficulty": data.resourceDifficulty,
        "resourceCategory": data.resourceCategory,
        "resourceSubCategory": data.resourceSubCategory,
        "resourceCost": data.resourceCost,
        "resourceGoesOnSale": data.resourceGoesOnSale

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
};


function getResource(id) {
  return new Promise(function(resolve, reject) {
    resource.findOne(
      {
        _id: id
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else {
          console.log("doc");
          console.log(doc);
          resolve(doc);
        }
      }
    );
  });
}

module.exports = router;
