//SETUP ROUTER
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var resource = require('../models/resourceModel');
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

// This accepts all posts requests!
router.get('/', function(req, res) {


    res.render('studyguides', {
        isUserAuthenticated: req.isAuthenticated(),
    });
});
module.exports = router;
