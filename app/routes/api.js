'use strict';

var maas = require('../../lib/maas');


function logAccess(req, res, next){
    maas.logger.info('%s %s %s %s', new Date().toString(), req.ip, req.user.username, req.path);
    next();
}

module.exports = function (app) {

    var account = require('../controllers/account'),
        users = require('../controllers/users'),
        vmSessions = require('../controllers/vm-sessions'),
        cloud = require('../controllers/cloud'),
        auth = require('../../lib/authentication');


    /******  User Account ******/

    app.route('/login')
        .post(account.login);

    // auth token required in header for access
    app.route('/changePassword')
        .post(account.changeUserPassword);


    /****** Admin Services ******/
   /** Any url prefixed with /services/* requires admin privs **/

   // API: check Token for admin role to /services/*
   app.all('/services/*', auth.checkAdminToken);

    /** Users **/
    app.route('/services/users')
        .get(users.listUsers);

    app.route('/services/user/:username')
        .get(users.getUser)
        .delete(users.deleteUser)
        .put(users.updateUser);

    app.route('/services/user')
        .post(users.addUser);

    /** VM Sessions **/
    app.route('/services/vm-session')
        .post(vmSessions.createSession)
        .put(vmSessions.updateSession);
        // no need to read or delete from proxy


    /** Cloud **/
    app.route('/services/cloud/setupVm/:username')
        .get(cloud.setUpVm);

    app.route('/services/cloud/devices')
        .get(cloud.listDevices);

    app.route('/services/cloud/assignvolume')
        .post(cloud.assignVolume);

    app.route('/services/cloud/volumes')
        .get(cloud.listVolumes);

    app.route('/services/cloud/volume/create')
        .post(cloud.createVolume);

    app.route('/services/cloud/images')
        .get(cloud.listImages);

};