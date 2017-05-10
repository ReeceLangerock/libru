//SETUP ROUTER
var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var resource = require("../models/resourceModel");
var categoryList = require("../models/categoryList.json");
var ensureLoggedIn = require("connect-ensure-login").ensureLoggedIn();
router.use(
  bodyParser.urlencoded({
    extended: true
  })
);
router.use(bodyParser.json());

router.get("/", function(req, res) {
  // check if user is authenticated and render add-resource page or access-denied
  if (req.isAuthenticated()) {
    res.render("view-add-resource", {
      isUserAuthenticated: req.isAuthenticated(),
      categoryList: categoryList
    });
  } else {
    res.render("view-access-denied", {
      isUserAuthenticated: req.isAuthenticated()
    });
  }
});

router.post("/submit", (req, res) => {
  // User can enter http or https url, this creates a sting to search if either case has been added previously
  var re = new RegExp("^(https)://", "i");
  var isHTTPS = re.test(req.body.resourceUrl);
  var emptyUrl;
  if (isHTTPS) {
    emptyUrl = req.body.resourceUrl.substring(5);
  } else {
    emptyUrl = req.body.resourceUrl.substring(4);
  }
  var httpUrl = "http" + emptyUrl;
  var httpsUrl = "https" + emptyUrl;

  checkIfResourceAlreadyAdded(httpUrl, httpsUrl).then((response, error) => {
    // if the url / resource hasn't been added
    if (response == "NOT_ADDED") {
      // if no subcategory was selected, default it to match the category
      if (!req.body.resourceSubCategory) {
        req.body.resourceSubCategory = req.body.resourceCategory;
      }
      //create new resource
      resource.schema.methods.newResource(req.body, req.user.mongoID);
      req.flash("success", "Resource added!\nClick anywhere to close.");
      res.redirect("back");
    } else {
      req.flash(
        "error",
        "This resource has already been added!\nClick anywhere to close."
      );
      res.redirect("back");
    }
  });
});

//Check if the url has been submitted previously
function checkIfResourceAlreadyAdded(httpUrl, httpsUrl) {
  return new Promise(function(resolve, reject) {
    resource.findOne(
      {
        $or: [{ resourceURL: httpUrl }, { resourceURL: httpsUrl }]
      },
      function(err, doc) {
        if (err) {
          reject(err);
        } else if (doc) {
          resolve(doc);
        } else {
          resolve("NOT_ADDED");
        }
      }
    );
  });
}

module.exports = router;
