'use strict';

var
    maas = require('../../lib/maas'),
    toDate = require('to-date');

// CREATE
// POST /services/vm-session
// body {username: '', expireAt: '', connectTime: ''}
// Response 200 {msg: msg}
// 400 missing parameter(s)
// 500 other errors
exports.createSession  = function(req,res){
    if (!req.body.username || !req.body.expireAt || !req.body.connectTime) {
        res.json(400, {msg: 'Missing parameter(s)'});
        return;
    }

    var conditions = {
        'username': req.body.username
    };
    var update = {
        'username': req.body.username,
        'expireAt': req.body.expireAt,
        'lastAction': new Date(0), // This sets to 1969
        'connectTime': req.body.connectTime // the time this connection was first established
    };
    var options = {
        'upsert': true
    };

    try {
        // if a VM session already exists for this user, overwrite it
        maas.VMSession.findOneAndUpdate(conditions, update, options, function (err, sess) {
            if (err) {
                res.json(500, {msg:'Error creating the session' });
            } else {
                res.json(200, {msg:'Created session successfully'});
            }
        });

    } catch (err) {
        res.json(500, {msg:'Error creating the session' });
    }
};

// UPDATE
// PUT /services/vm-session
// body {username: '', lastAction: '', connectTime: ''}
// Response 200 {msg: msg}
// 400 missing parameter(s)
// 500 other errors
exports.updateSession = function (req, res) {
    if (!req.body.username || !req.body.lastAction || !req.body.connectTime) {
        res.json(400, {msg: 'Missing parameter(s)'});
        return;
    }

    var query = {
        'username': req.body.username,
        // requiring connectTime makes sure we don't update this VMSession after the user reconnected
        // (for instance, if a user connects with a second device while the first one is connected)
        'connectTime': req.body.connectTime
    };
    var update = {
        'lastAction': req.body.lastAction
    };

    try {
        maas.VMSession.update(query, update, function (err) {
            if (err) {
                res.json(500, {msg:'Error updating the session'});
            } else {
                res.json(200, {msg:'Updated session successfully'});
            }
        });
    } catch (err) {
        res.json(500, {msg:'Error updating the session'});
    }
};
