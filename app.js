//SETUP
var express = require("express");
var mongoose = require("mongoose");
var path = require("path");
var port = process.env.PORT || 3000;
var app = express();
var config = require("./config.js");
var flash = require("connect-flash");
var passport = require("passport");
var session = require("express-session");
var bodyParser = require("body-parser");
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

var mongoUser = process.env.DB_USERNAME || config.getMongoUser();
var mongoPass = process.env.DB_PASSWORD || config.getMongoPass();

mongoose.connect(
  `mongodb://${mongoUser}:${mongoPass}@ds131340.mlab.com:31340/libru`
);
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection eror:"));
db.once("open", function() {
  console.log("connected");
});

//EXPRESS SETUP
app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "views")));
app.use("/bower_components", express.static(__dirname + "/bower_components"));
app.set("view engine", "ejs");

//passport setup
app.use(session({ secret: "123secret" /*process.env.PASSPORT_SECRET*/ }));
app.use(passport.initialize());
app.use(passport.session());

//req.flash message setup
app.use(flash());
app.use(function(req, res, next) {
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
});

//ROUTES
app.use("/", require("./controllers/controller.index"));
app.use("/signin", require("./controllers/controller.signin"));
app.use("/signout", require("./controllers/controller.signout"));
app.use("/add-resource", require("./controllers/controller.add-resource"));
app.use("/edit-resource", require("./controllers/controller.edit-resource"));
app.use("/resource", require("./controllers/controller.resource"));
app.use("/resources", require("./controllers/controller.all-resources"));
app.use("/studyguides", require("./controllers/controller.study-guides"));
app.use("/portfolios", require("./controllers/controller.all-portfolios"));
app.use("/help", require("./controllers/controller.help"));
app.use("/about", require("./controllers/controller.about"));

app.use("/user/resources", require("./controllers/controller.user-resources"));
app.use("/user/studyguides", require("./controllers/controller.user-study-guides"));
app.use("/user/settings", require("./controllers/controller.user-settings"));
app.use("/user/profile", require("./controllers/controller.manage-resources"));

app.use(function (req, res, next) {
  res.status(404).render('view-404', {
      isUserAuthenticated: req.isAuthenticated(),
  });
})

//launch
app.listen(port, function() {
  console.log(`Libru listening on port ${port}!`);
});
