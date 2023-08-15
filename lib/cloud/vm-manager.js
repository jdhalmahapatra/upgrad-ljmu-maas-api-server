'use strict';

var
    maas = require('../../lib/maas'),
    Q = require('q'),
    toDate = require('to-date');

/**
 * Runs an interval to terminate expired VMs (those that have been idle for too long)
 * This ensures that resources are freed up when users aren't using their VMs
 */
exports.startExpirationInterval = function () {
    setInterval(
        function () {
            // Get an array of all sessions whose VMs are expired
            getExpiredVmSessions()
                .then(function (obj) {
                    maas.logger.debug("getExpiredVmSessions returned %d result(s)", obj.length);
                    // loop through each session in the collection:
                    for (var i = 0; i < obj.length; i++) {
                        // record the session information
                        var sess = obj[i],
                            query = {'username': sess.username};

                        // remove the session
                        sess.removeQ()
                            .then(function (result) {
                                maas.logger.verbose("Removed VM session for '%s'", result.username)
                            }).catch(function (err) {
                                maas.logger.error("Couldn't remove VM session:", err.message);
                            }).done();

                        // obtain and remove the user's VM information, then destroy the VM
                        maas.User.findOneQ(query)
                            .then(removeUserVM)
                            .then(maas.cloud.destroyVM)
                            .catch(function (err) {
                                maas.logger.error("Failed to destroy expired VM:", err.message);
                            }).done();
                    }
                }).catch(function (err) {
                    maas.logger.error("Failed to process expired VMs:", err.message);
                }).done();
        },
            maas.config.get('vm_check_interval') * 1000
    );
};

// private function, returns a promise
function getExpiredVmSessions(req, res) {
    var query = {
        'lastAction': {
            '$lt': toDate(maas.config.get('vm_idle_ttl')).seconds.ago,
            '$gt': new Date(0) // the lastAction has to be > 0, otherwise the session is active
        }};

    return maas.VMSession.findQ(query);
    // omit rejection handler, send result or error to output promise
};

// private function, returns a promise
function removeUserVM(user) {
    if (!user.vm_id || user.vm_id.length == 0) {
        return Q.reject(new Error("removeUserVM failed, user '" + user.username
            + "' has no vm_id defined (was this user's vm_ip manually assigned?)"));
    }

    var obj = {
        'vm_id': user.vm_id,
        'vm_ip': user.vm_ip,
        'vm_ip_id': user.vm_ip_id
    };

    // clear the user's VM info and save it
    user.vm_id = user.vm_ip = user.vm_ip_id = "";
    return user.saveQ()
        .then(function (result) {
            // after we finish saving, return an object with the info that's been removed
            return obj;
        });
    // omit rejection handler, send result or error to output promise
};
