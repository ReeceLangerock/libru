//SETUP ROUTER
var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var user = require('../models/userModel');
var resource = require('../models/resourceModel');
router.use(bodyParser.urlencoded({
    extended: true
}));
router.use(bodyParser.json());

// This accepts all posts requests!
router.get('/', function(req, res) {

    getUser(req.user.mongoID).then((response, error) => {
            console.log(response);
            res.render('user-settings', {
                isUserAuthenticated: req.isAuthenticated(),
                userData: response

            });
        })



    })




function getUser(userID) {
    return new Promise(function(resolve, reject) {
        user.findOne({
            _id: userID
        }, function(err, doc) {
            if (err) {
                reject(err);
            } else {

                resolve(doc);
            }
        });

    });
}

module.exports = router;
