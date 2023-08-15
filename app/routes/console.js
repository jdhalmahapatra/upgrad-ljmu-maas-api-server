'use strict';

module.exports = function (app) {
    // Root routing
    var console = require('../controllers/console');

    app.route('/')
        .get(console.index);

    // Signup/Register
    app.route('/auth/signup')
        .get(console.listSupportedDevices)
        .post(console.signup);
    // Signin
    app.route('/auth/signin')
        .post(console.signin);
    // Logout
    app.route('/auth/signout')
        .get(console.signout);


    // Change Password
    app.route('/users/password')
        .post(console.requiresLogin, console.changePassword);


    // All Admin Priv
    app.route('/users')
        .get(console.requiresLogin, console.requiresAdmin, console.list)
        .put(console.requiresLogin, console.requiresAdmin, console.update);

    app.route('/users/:uid')
        .get(console.requiresLogin, console.requiresAdmin, console.read)
        .delete(console.requiresLogin, console.requiresAdmin, console.deleteUser)
        .put(console.requiresLogin, console.requiresAdmin, console.update);

    app.route('/users/create/volume').post(console.requiresLogin, console.requiresAdmin, console.createVolume);

    app.route('/cloud/volumes')
        .get(console.requiresLogin, console.requiresAdmin, console.listVolumes);

    app.route('/cloud/images')
        .get(console.requiresLogin, console.requiresAdmin, console.listImagesDevices);

    //app.route('/cloud/startVm')
    //    .post()
};