﻿'use strict';
var express = require('express');
var router = express.Router();
var db = require('../db').connection;
var passport = require('passport');
var auth = require('passport-local-authenticate');
var app = require('../app');

// GET home page and check if user is logged in
// if is -> go to Angular app
router.get('/', function (req, res) {
    if (req.user) {
        res.render('angular', { user: req.user });
    } else {
        var session = req.session;
        res.render('index', { title: 'ILECHAT', user: req.user });
    }
});

// Handle registration POST
router.post('/register', function (req, res) {
    var uname = req.body.username;
    var pword = req.body.password;
    
    db.createUser(uname, pword, function (err, user) {
        if (err) {
            res.send('user exists');
        } else {
            req.login(user, function (err) {
                if (err) {
                    console.log(err);
                }
            });
            res.send({ result: "success" });
        }
    });   
});

// Handle login POST with Passport authentication
router.post('/login', passport.authenticate('local'), function (req, res) {
    console.log(req.user);
    res.send({ result: "success" });
});

// Logout user
router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// Api function for getting all rooms from database
router.get('/api/get-rooms', function (req, res, next) {
    if (req.user) {
        console.log(req.user);
        db.getAllRooms(function (err, rooms) {
            if (err) {
                res.send(err);
            } else {
                console.log(rooms);
                res.json(rooms);
            }
        });
    }
});

// Api function for getting user details
router.get('/api/get-user-details', function (req, res, next) {
    res.json(req.user);
});

// Api function for getting specific room info
router.get('/api/get-room-details/:id', function (req, res, next) {
    console.log(req.params.id);

    db.getRoom(req.params.id, function (err, room) {
        if (err) {
            console.log('no such room');
            res.redirect('/new');
        } else {
            res.json(room);
        }
    });
});

// Api function for creating room
router.post('/api/newroom', function (req, res) {
    var name = req.body.name;
    var desc = req.body.desc;
    var privateR = req.body.private;

    console.log(req.body);

    db.createRoom(name, desc, privateR, function (err, room) {
        if (err) {
            console.log(err);
            res.status(500).send({"error": err});
        } else {
            console.log(room);
            res.json(room);
        }
    });
});

// Catch all other routes and render Angular app
router.get('*', function (req, res, next) {
    if (req.user) {
        res.render('angular', { user: req.user });
    } else {
        var session = req.session;
        console.log(session);
        res.render('index', { title: 'Express' });
    }
});

module.exports = router;