'use strict';

var
    maas = require('../../lib/maas'),
    Q = require('q'),
    filtered_fields = '_id username email password_change_needed approved device_type volume_id vm_ip vm_ip_id vm_id roles';


// GET /services/cloud/setupVm/:username
exports.setUpVm = function (req, res) {
    var un = req.params.username;

    if(un) {
        maas.User.findUserWithPromise({username: un})
            .then(function (userObj) {
                if (!userObj) {
                    maas.logger.error("setUpVm failed to find user");
                    res.json(404, {msg: "User not found"});
                }
                // before we proceed, validate some user properties first
                else if (!userObj.vm_ip && maas.config.get('new_vm_defaults:images')[userObj.device_type] === undefined)
                    throw new Error("User '" + userObj.username + "' has an unknown device type '" + userObj.device_type + "'");
                else if (!userObj.vm_ip && userObj.volume_id === '')
                    throw new Error("User '" + userObj.username + "' does not have a Volume ID");
                else {
                    return maas.cloud.setUpUser(userObj)
                    .then(function (userObj) {
                        //userObj.vm_port = maas.config.get('vm_port');
                        // for some reason, setting a property on userObj doesn't stick - make a new object instead
                        var obj = {
                            'vm_ip': userObj.vm_ip,
                            'vm_port': maas.config.get('vm_port')
                        };
                        res.json(200, obj);
                    }); // don't catch errors here
                }
            }).catch(function (err) {
                maas.logger.error("setUpVm failed:", err.message);
                res.json(500, {});
            }).done();
    }
};


// GET /services/cloud/images (TESTED)
exports.listImages = function (req, res) {
    var result = {flavors: [], images: []};

    maas.cloud.getFlavors(function (err, allflavors) {

        if (err) {
            maas.logger.error("listImages failed to get flavors:", err.message);
            res.json(500, {msg: "Error listing Cloud Flavors"});
        } else {
            for (var i = 0; i < allflavors.length; i++) {
                var o = allflavors[i];
                result.flavors.push([ o._id , o.name]);
            }
            maas.cloud.getImages(function (err, r) {

                if (err) {
                    maas.logger.error("listImages failed to get images:", err.message);
                    res.json(500, {msg: "Error listing Cloud Images"});
                } else {
                    for (i = 0; i < r.length; i++) {
                        var o = r[i];
                        result.images.push([o._id, o.name]);
                    }

                    res.json(200, result);
                }
            });
        }
    });
};

/**
 * GET /services/cloud/devices (TESTED)
 * Returns and object of the device types: {note2:"1234,....}
 * @param req
 * @param res
 */
exports.listDevices = function (req,res) {
    var obj = maas.config.get("new_vm_defaults:images");
    res.json(200,obj);
};

// GET /services/cloud/volumes   (TESTED)
exports.listVolumes = function (req, res) {
    var results = [];
    maas.cloud.getVolumes(function (err, r) {
        if (err) {
            maas.logger.error("listVolumes failed:", err.message);
            res.json(500, {msg: "Problem listing volumes"});
        } else {
            //console.log(r);
            for (var i = 0; i < r.length; i++) {
                var name = r[i].name || 'unk';
                results.push([ name, r[i].status, r[i].id]);
            }
            res.json(200, {volumes: results});
        }
    });
};

/**
 * Creates a volume for a user.
 * POST /services/cloud/volume/create (TESTED)
 * Request: body: {username: 'some username'}
 *
 */
exports.createVolume = function (req, res) {
    var jsonObj = req.body;
    if (!jsonObj.username) {
        res.json(400, {msg: 'Missing required fields'});
        return;
    }

    maas.User.findUserWithPromise(jsonObj)
        .then(function (userObj) {
            if (!userObj) {
                maas.logger.error("createVolume failed to find user");
                res.json(404, {msg: "User not found"});
            } else {
                return maas.cloud.createVolumeForUser(userObj)
                .then(function(userObj) {
                    var u = userObj.user;
                    maas.User.update({username: u.username}, {volume_id: u.volume_id}, function (err, numberAffected, raw) {
                        if (err) {
                            maas.logger.error("createVolume failed to find user:", err.message);
                            res.json(404, {msg: "User not found"});
                        } else {
                            if (numberAffected === 1) {
                                res.json(200, {});
                            }
                        }
                    })
                }); // dont catch errors here
            }
        })
        .catch(function (err){
            maas.logger.error("createVolume failed:", err.message);
            res.json(500, {msg: "Problem creating Volume for user"});
        }).done();
};

/**
 * Assign a volume to a user.  Assumes the volume and user already exist
 * POST /services/cloud/assignvolume (TESTED)
 * Request: body: {username: 'some username', volid: 'volid' }
 *
 */
exports.assignVolume = function (req, res) {
    var requestObj = req.body;
    if( requestObj.username && requestObj.volid) {
        maas.User.findUserWithPromise({username: requestObj.username})
            .then(function (userObj) {
                if (!userObj) {
                    maas.logger.error("assignVolume failed to find user");
                    res.json(404, {msg: "User not found"});
                } else {
                    userObj.volume_id = requestObj.volid;
                    return maas.User.updateUserWithPromise(userObj)
                    .then(function (u) {
                        res.json(200, {});
                    });
                }
            }).catch(function (err) {
                maas.logger.error("assignVolume failed:", err.message);
                res.json(500,{msg: "Error assigning volume"});
            }).done();

    } else {
        res.json(400, {msg: 'Missing required fields'});
    }
};
