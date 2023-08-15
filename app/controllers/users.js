'use strict';

var
    maas = require('../../lib/maas'),
    Q = require('q'),
    filtered_fields = '_id username email password_change_needed approved device_type volume_id vm_ip vm_ip_id vm_id roles';

// GET /services/users
exports.listUsers = function (req, res) {
    maas.User.find({})
    .select(filtered_fields)
    .exec(function (err, users) {
        if (err) {
            res.json(500, {msg: 'Error finding users: ' + err.message});
        } else if (!users) {
            res.json(404, {msg: 'Users not found'});
        } else {
            res.json(200, {users: users});
        }
    });
};

// GET /services/user/:username
exports.getUser = function (req, res) {
    var username = req.params.username;
    if (!username) {
        res.json(400, {msg: 'Bad request'});
    } else {
        maas.User.findOne({username: username}, filtered_fields, function (err, user) {
            if (err) {
                res.json(500, {msg: 'Error finding user: ' + err.message});
            } else if (!user) {
                res.json(404, {msg: 'User not found'});
            } else {
                res.json(200, {user: user});
            }
        });
    }
};

// POST /services/user
exports.addUser = function (req, res) {
    var user = req.body.user;
    var devices = maas.config.get("new_vm_defaults:images");
    if (!user.device_type || user.device_type.length == 0 || !devices.hasOwnProperty(user.device_type)) {
        res.json(400, {msg: 'Invalid device type specified'});
    } else if (!user || !user.username || !user.password || !user.email) {
        res.json(400, {msg: 'Missing required fields'});
    } else {
        new maas.User({
            username: user.username,
            password: user.password,
            email: user.email,
            password_change_needed: true,
            device_type: user.device_type,
            volume_id: ''
        }).save(function (err,u,num) {
            if (err) {
                res.json(500, {msg: 'Error adding user: ' + err.message});
            } else {
                res.json(200, {id: u.id});
            }
        });
    }
};

// DELETE /services/user/:username
exports.deleteUser = function (req, res) {
    var username = req.params.username;
    if (!username) {
        res.json(400, {msg: 'Missing required fields'});
    } else {
        maas.User.findOne({username: username}, function (err, user) {
            if (err) {
                res.json(500, {msg: 'Error finding user to delete: ' + err.message});
            } else if (!user) {
                res.json(404, {msg: 'User not found'});
            } else {
                user.remove();
                res.json(200, {});
            }
        });
    }
};

// PUT /services/user/:username
exports.updateUser = function (req, res) {
    var username = req.params.username;
    var updates = req.body.update;
    if (!username || !updates) {
        res.json(400, {msg: 'Missing required fields'});
    } else {
        maas.User.update({username: username}, updates, function (err, numberAffected, raw) {
            if (err) {
                res.json(500, {msg: 'Error updating user: ' + err.message});
            } else if (numberAffected === 0) {
                res.json(404, {msg: 'User not found'});
            } else {
                res.json(200, {});
            }
        });
    }
};
