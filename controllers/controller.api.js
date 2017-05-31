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

var queryTerms = [
  "title",
  "url",
  "difficulty",
  "category",
  "subcategory",
  "cost"
];
var queryResponses = [
  "resourceTitle",
  "resourceURL",
  "resourceDifficulty",
  "resourceCategory",
  "resourceSubCategory",
  "resourceCost"
];

router.get("/", function(req, res) {
  res.render("view-api", {
    isUserAuthenticated: req.isAuthenticated()
  });
});

router.get("/category-list", function(req, res) {
  res.send(categoryList);
});

router.get("/:query", function(req, res) {
  var query = req.params.query;
  var result = {};
  var numResourcesToGet = 50;
  var sorting = 1;
  query.split("&").forEach(function(part) {
    var item = part.split("=");
    if (item[0] === "count") {
      numResourcesToGet = (parseInt(item[1] <= 50 ? parseInt(item[1]) : 50);
    } else if (item[0] === "date" && item[1] === "desc") {
      sorting = -1;
    } else {
      result[parseQueryTerm(item[0])] = decodeURIComponent(item[1]);
    }
  });

  getRequestedResources(
    result,
    numResourcesToGet,
    sorting
  ).then((response, error) => {
    for (var i = 0; i < response.length; i++) {
      response[i]["libruResourceURL"] =
        "http://libru1.herokuapp.com/resource/" + response[i]["_id"];
      delete response[i]["_id"];
      delete response[i]["resourceFlaggedBrokenLink"];
      delete response[i]["resourceFlaggedInappropriate"];
      delete response[i]["resourceAddedBy"];

    }
    res.send(response);
  });
});

function parseQueryTerm(term) {
  term = term.toLowerCase();

  queryTerms.indexOf(term);
  return queryResponses[queryTerms.indexOf(term)];
}

function parseQueryModifier(modifier) {
  modifier = '{ $regex: '+modifier + "/i";
  return modifier;
}

function getRequestedResources(query, numResourcesToGet, sorting) {
  console.log(query);
  return new Promise(function(resolve, reject) {
    resource
      .find(query)
      .lean()
      .limit(numResourcesToGet)
      .sort({
        dateAdded: sorting
      })
      .exec(function(err, doc) {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
  });
}

module.exports = router;
