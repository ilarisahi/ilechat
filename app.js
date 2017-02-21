﻿'use strict';
var debug = require('debug')('chatapp');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var auth = require('passport-local-authenticate');
var db = require('./db').connection;

var index = require('./routes/index');

var app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Session and passport middlewares
app.use(session({
    secret: 'ebin make lul doge',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Set static folders
app.use(express.static(path.join(__dirname, 'public')));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'client')));

// Set routes
app.use('/', index);

// Passport functions for user authentication
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    db.getUsrData(id, function (err, user) {
        if (!err) {
            done(null, user);
        } else {
            console.log(err);
            done(null, null);
        }
    });
});

// Local strategy for verifying user via Passport
passport.use('local', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, function (username, password, done) {
    db.getUsr(username, password, function (err, user) {
        if (err) {
            console.log("got an error (user doesn't exist)");
            done('user does not exist');
        } else {
            console.log("user exists");
            console.log(user);
            done(null, user);
        }
    });
}));

// Setting app port
app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

// Initializing sockets
var io = require('socket.io').listen(server);

// Socket functions
io.on('connection', function (socket) {
    console.log('a user connected');

    // Set socket's username parameter
    socket.on('joinChat', function (data) {
        socket.username = data.uname;
    });

    // When joining to room, leave from other rooms
    socket.on('joinRoom', function (data) {
        console.log('connecting ' + data.uname + ' to ' + data.rname);
        for (var r in socket.rooms) {
            socket.leave(r);
        }
        socket.join(data.rname);
    });

    // Emit incoming messages to other users
    socket.on('chat message', function (msg) {
        console.log('message: ' + msg.message);
        if (msg.room) {
            socket.broadcast.to(msg.room).emit('chat message', msg);
        } else if (msg.c_id) {
            io.of('/').connected[msg.c_id].emit('chat message', msg);
        }
    });
});

// Get list of online users
exports.getOnlineUsers = function () {
    var uList = [];
    var users = io.of('/').connected;

    for (var u in users) {
        var uObj = users[u];
        uList.push({ username: uObj.username, id: uObj.id });
    }
    return uList;
}

//Get socket's user info
exports.getSocket = function (id, cb) {
    var users = io.of('/').connected;

    if (id in users) {
        cb(null, { name: users[id].username, id: users[id].id });
    }

    else cb('socket not found');
};

module.exports = app;