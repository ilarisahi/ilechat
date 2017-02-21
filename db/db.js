var sql = require('mssql');
var datetime = require('node-datetime');
var auth = require('passport-local-authenticate');
var config = require('./db.config').config;

sql.connect(config, function (err) {
    if (err) {
        console.log('MSSQL error: ' + err);
        return;
    }
});

// Get user id from database
var checkUser = function (name, cb) {
    var ps = new sql.PreparedStatement();
    ps.input('username', sql.VarChar);
    ps.prepare('select id from users where username = @username', function (err) {
        if (err) {
            console.log("get user id prepare error" + err);
        }
        
        ps.execute({ username: name }, function (err, recordset) {
            if (err) {
                console.log("get user id execute error" + err);
            }
            if (err || !recordset.length) {
                console.log(err);
                cb('user does not exist')
            } else {
                cb(null, recordset[0].id);
            }
            ps.unprepare(function (err) {
                if (err) {
                    console.log("get user id unprepared error" + err);
                }                
            });
        });
    });
}

// User creation
exports.createUser = function (username, password, cb) {
    console.log('creating user');
    checkUser(username, function (err, id) {
        if (err) {
            console.log(err);
            console.log('getting through checkuser');

            // Hash password for database
            auth.hash(password, function (err, hashed) {
                var dt = datetime.create();
                dt = dt.format('Y/m/d H:M:S');

                var ps = new sql.PreparedStatement();
                ps.input('username', sql.VarChar);
                ps.input('salt', sql.VarChar);
                ps.input('hash', sql.VarChar);
                ps.input('created', sql.VarChar);
                ps.input('last_login', sql.VarChar);

                ps.prepare('insert into users (username, salt, hash, created, last_login) values (@username, @salt, @hash, @created, @last_login) select scope_identity() as id', function (err) {
                    if (err) {
                        console.log('user creation prepare error:' + err);
                    }                    
                    ps.execute({ username: username, salt: hashed.salt, hash: hashed.hash, created: dt, last_login: dt }, function (err, recordset) {                        
                        if (err || !recordset.length) {
                            console.log('user creation execute error:' + err);
                            cb(err)
                        } else {
                            var user = {
                                id: recordset[0].id,
                                username: username,
                                registered: dt,
                                last_visit: dt
                            }
                            console.log("Login user:" + user);
                            cb(null, user);
                        }
                        ps.unprepare(function (err) {
                            if (err) {
                                console.log('user creation unprepare error:' + err);
                            }                            
                        });
                    });
                });
            });            
        } else {
            cb('user already exists');
        }
    });
}

// User login
exports.getUsr = function (username, password, cb) {
    var ps = new sql.PreparedStatement();
    ps.input('username', sql.VarChar);

    ps.prepare("SELECT * FROM users WHERE username = @username", function (err) {
        if (err) {
            console.log('user login prepare error:' + err);
        }
        ps.execute({ username: username }, function (err, recordset) {
            if (err || !recordset.length) {
                console.log('user login execute error:' + err);
                cb(err)
            } else {
                var hashed = { salt: recordset[0].salt, hash: recordset[0].hash };
                auth.verify(password, hashed, function (err, verified) {
                    if (verified) {

                        // Return user and update last_login field
                        var user = {
                            id: recordset[0].id,
                            username: recordset[0].username,
                            registered: recordset[0].created,
                            last_visit: recordset[0].last_login
                        };
                        var dt = datetime.create();
                        dt = dt.format('Y/m/d H:M:S');

                        var ups = new sql.PreparedStatement();
                        ups.input('username', sql.VarChar);
                        ups.input('last_login', sql.VarChar);
                        ups.prepare('update users set last_login = @last_login where username = @username', function (err) {
                            if (err) {
                                console.log("user login prepare error" + err);
                            }
                            ups.execute({ username: username, last_login: dt }, function (err, recordset) {
                                if (err) {
                                    console.log("user login execute error" + err);
                                    cb(err)
                                } else {
                                    cb(null, user);
                                }
                                ups.unprepare(function (err) {
                                    if (err) {
                                        console.log("user login unprepare error" + err);
                                    }
                                });
                            });
                        });
                    } else {
                        cb('wrong password');
                    }
                });
            }
            ps.unprepare(function (err) {
                if (err) {
                    console.log("user login unprepare error" + err);
                }
            });
        });
    });
}

// Get user data by user id
exports.getUsrData = function (id, cb) {
    var ps = new sql.PreparedStatement();
    ps.input('id', sql.Int);
    ps.prepare('select * from users where id = @id', function (err) {
        if (err) {
            console.log(err);
        }

        ps.execute({ id: id }, function (err, recordset) {
            if (err || !recordset.length) {
                console.log(err);
                cb(err)
            } else {
                var user = {
                    id: recordset[0].id,
                    username: recordset[0].username,
                    registered: recordset[0].created,
                    last_visit: recordset[0].last_login
                }
                cb(null, user);
            }
            ps.unprepare(function (err) {
                if (err) {
                    console.log(err);
                }
            });
        });
    });
}

// Get room data by room id
exports.getRoom = function (id, cb) {
    var ps = new sql.PreparedStatement();
    ps.input('id', sql.Int);
    ps.prepare('select * from rooms where id = @id', function (err) {
        if (err) {
            console.log("get room id prepare error" + err);
        }

        ps.execute({ id: id }, function (err, recordset) {
            if (err) {
                console.log("get room id execute error" + err);
            }
            if (err || !recordset.length) {
                console.log(err);
                cb('user does not exist')
            } else {
                var room = {
                    id: recordset[0].id,
                    name: recordset[0].name,
                    desc: recordset[0].description,
                    created: recordset[0].created
                }
                cb(null, room);
            }
            ps.unprepare(function (err) {
                if (err) {
                    console.log("get room id unprepared error" + err);
                }
            });
        });
    });
}

// Get all rooms from database
exports.getAllRooms = function (cb) {
    console.log('getting all rooms');
    var request = new sql.Request();
    request.query("SELECT * FROM rooms", function (err, recordset) {
        if (err || !recordset.length) {
            cb(err + 'empty query');
        } else {
            cb(null, recordset);
        }
    });
}

// Room creation
exports.createRoom = function (name, desc, privateR, cb) {
    console.log('creating room');
    console.log(name + desc);

    var ps = new sql.PreparedStatement();
    ps.input('name', sql.VarChar);

    ps.prepare('select id from rooms where name = @name', function (err) {
        ps.execute({ name: name }, function (err, recordset) {
            if (recordset.length) {
                console.log(err);
                cb('room exists');
            } else {
                var dt = datetime.create();
                dt = dt.format('Y/m/d H:M:S');

                var psn = new sql.PreparedStatement();
                psn.input('name', sql.VarChar);
                psn.input('description', sql.Text);
                psn.input('created', sql.VarChar);
                psn.input('private', sql.Bit);
                psn.prepare('insert into rooms (name, description, created, private) values (@name, @description, @created, @private) select scope_identity() as id', function (err) {
                    if (err) {
                        console.log(err);
                        console.log("create room prepare error" + err);
                    }

                    psn.execute({ name: name, description: desc, created: dt, private: privateR }, function (err, recordset) {
                        if (err) {
                            console.log("create room execute error" + err);
                        }
                        if (err || !recordset.length) {
                            console.log(err);
                            cb(err)
                        } else {
                            var room = {
                                id: recordset[0].id,
                                name: name,
                                desc: desc,
                                created: dt
                            }
                            cb(null, room);
                        }
                        psn.unprepare(function (err) {
                            if (err) {
                                console.log("create room unprepared error" + err);
                            }
                        });
                    });
                });
            }

            ps.unprepare(function (err) {
                if (err) {
                    console.log(err);
                }
            });
        });
    });
}