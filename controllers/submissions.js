//SETUP ROUTER
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var resource = require('../models/resourceModel');
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

// This accepts all posts requests!
router.get('/', function(req, res) {
    res.render('submissions', {
      isUserAuthenticated: req.isAuthenticated()
    });

});




module.exports = router;
