'use strict';

var
    maas = require('../../lib/maas'),
    auth = require('../../lib/authentication'),
    strategy = auth.loadStrategy(),
    toDate = require('to-date'),
    uuid = require('node-uuid'),
    util = require('util');

/**
 * Login/Authenticate User.
 *
 * Loads authentication strategy based on config file settings (TLS, PAM, DB)
 * and checks if password change is needed.
 *
 * On Success, returns a JSON payload with a JWT token that the client must send
 * as a header field in subsequent requests to get access.
 * @param req
 * @param res
 */
exports.login = function(req,res) {
    // use loaded strategy for authentication
    res.logUsername = req.body.username;

    // check to see if this user account is currently locked
    var error = maas.lockout.checkForLock(req.body.username);
    if (error) {
        res.logMessage = error;
        res.json(401,{msg: error});
        return;
    }

    strategy(req,function(errCode,result) {
        if(errCode) {
            res.logMessage = 'Invalid login credentials';
            res.json(errCode,{msg: 'Error authenticating'});
            // report a failed login attempt
            maas.lockout.failedAttempt(req.body.username);
        } else {
            res.logMessage = 'Login successful';
            sendToken(res, result);
        }
    });
};


/**
 * Change current User password
 * @param req
 * @param res
 */
exports.changeUserPassword = function(req,res) {
    var un = req.body.username;
    var oldPassword = req.body.password;
    var newPassword = req.body.newPassword;

    res.logUsername = un;
    if (!un || !oldPassword || !newPassword) {
        res.logMessage = 'Missing required fields';
        res.json(400, {msg: 'Missing required field(s)'});
    } else {
        maas.User.findOne({username: un}, function (err, user) {
            if (err) {
                res.logMessage = 'Internal error';
                res.json(500, {msg: 'Internal error'});
            }
            else if (user && user.authenticate(oldPassword)) {

                user.password = newPassword;
                user.password_change_needed = false;

                user.save(function (err1, r) {
                    if (err1) {
                        // user model validation failed
                        res.logMessage = 'Failed validation';
                        res.json(400, {msg: 'Failed validation'});
                    } else {
                        res.logMessage = 'Password change successful';
                        sendToken(res, {'user': user});
                    }
                });
            }
            else {
                // failed authentication, reject
                res.logMessage = 'Error authenticating';
                res.json(401, {msg: 'Error authenticating'}); // UnAuth
            }
        });
    }

};

// private function
function sendToken(res, result) {
    // Setup token
    // result either contains an existing token, or a user object

    var max_session;
    var token = result.token;
    if (token) {
        // the client used a JWT to log in; instruct them to reuse it
        // we tell the client the number of seconds the token is valid; this has decreased
        max_session = (new Date(result.exp).getTime() - new Date().getTime()) / 1000;
    } else {
        // the client authenticated some other way; make a new token
        max_session = maas.config.get('max_session_length');
        var args = {
            'sub': result.user.username,
            'role': result.user.roles[0],
            'exp': Math.floor(toDate(max_session).seconds.fromNow / 1000),
            //'iss': maas.config.get('rest_server_url'),
            'jti': uuid.v4()
        };
        token = auth.makeToken(args);
    }

    // Response object
    var responseObj = {
        sessionInfo: {
            token: token,
            maxLength: max_session
        },
        server: {
            host: maas.config.get('proxy_host'),
            port: maas.config.get('proxy_port')
        },
        webrtc: maas.config.get("webrtc")
    };

    res.json(200,responseObj);
}
