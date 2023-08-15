'use strict';

var
    fs = require('fs'),
    maas = require('../../lib/maas'),
    jwt = require('jsonwebtoken');

// do NOT read this directly, use the getter methods
var pubKey = null;

module.exports = function (app) {
    var logLevel = maas.config.get('log_level');

    app.use(function (req, res, next) {
        // intercept the response before it gets sent
        var token = req.get('maas-authtoken');
        if (token) {
            var send = res.send;
            res.send = function (string, m) {
                var token = req.get('maas-authtoken');
                // 'this' is the response

                if (logLevel === 'debug' || logLevel === 'silly') {
                    var that = this;
                    var decoded = jwt.decode(token);
                    // not every API call will contain a JWT; if it does (for admin APIs), pull the username out of it
                    var reqUser = decoded.sub + "@";
                    // debug: log the request address/method/URL and response status code
                    maas.logger.debug("Request (%s%s) %s '%s'; Response code: %d",
                        reqUser, req.connection.remoteAddress, req.method, req.originalUrl, that.statusCode);
                }
                if (logLevel === 'silly') {
                    // identify part of the JWT if the client presented one
                    var reqJWT = JSON.stringify(decoded);
                    var resJSON = JSON.parse(string);
                    // silly: log the JWT/body and response body
                    maas.logger.silly("  Request JWT: '%s', JSON: %s; Response JSON: %s",
                        reqJWT, JSON.stringify(req.body, stringifyFilter), JSON.stringify(resJSON, stringifyFilter));
                }
                // we're done logging, finish sending the response
                send.call(this, string);
            };
        }

        /*var send = res.send;
         res.send = function (string, m) {
         var token = req.get('maas-authtoken');
         // 'this' is the response

         if ((logLevel === 'debug' || logLevel === 'silly') && token) {
         var that = this;

         // The below fails on requests without tokens, such as console calls
         //if (!token) {
         //    token = ""; // prevents JWT verification error
         //}
         var decoded = jwt.decode(token);
         // not every API call will contain a JWT; if it does (for admin APIs), pull the username out of it
         var reqUser = decoded.sub + "@";

         // debug: log the request address/method/URL and response status code
         maas.logger.debug("Request (%s%s) %s '%s'; Response code: %d",
         reqUser, req.connection.remoteAddress, req.method, req.originalUrl, that.statusCode);
         }
         if (logLevel === 'silly' && token) {
         // identify part of the JWT if the client presented one
         var reqJWT = JSON.stringify(decoded);
         var resJSON = JSON.parse(string);
         // silly: log the JWT/body and response body
         maas.logger.silly("  Request JWT: '%s', JSON: %s; Response JSON: %s",
         reqJWT, JSON.stringify(req.body, stringifyFilter), JSON.stringify(resJSON, stringifyFilter));
         }
         // we're done logging, finish sending the response

         console.log("IN LOG: ", m);

         send.call(this, string);
         };*/
        // move on to the next middleware (token check, then requested route)
        next();
    });
};

// filter values that are stringified in Request/Response JSON so we don't leak sensitive info
// or spam the logs with output from arrays of data
function stringifyFilter(key, value) {
    if (value === null) {
        return undefined;
    } else if (value instanceof Array && value.length > 0) {
        return "<filtered array>";
    } else if (key === "password" || key === "newPassword") {
        return "<hidden>";
    } else if (key === "token") {
        return shortJWT(value);
    }

    return value;
}

// shortens a client's JWT to prevent logging sensitive information
function shortJWT(token) {
    var short = "";
    if (token) {
        var printChars = 6; // how many chars to print from the end of the JWT
        if (token.length > printChars)
            token = "..." + token.substr(token.length - printChars);
        short = token;
    }
    return short;
}

// get the public token verification key
// load it from disk if not already in memory
function getPubKey() {
    if (pubKey === null) {
        pubKey = fs.readFileSync(maas.config.get('server_certificate'));
    }
    return pubKey;
}
