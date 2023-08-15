
'use strict';


module.exports = function (grunt) {

    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        mochaTest: {
            src: ['test/**/*.js'],
            options: {
                reporter: 'spec',
                require: 'server.js'
            }
        }
    });

    // Load NPM tasks
    require('load-grunt-tasks')(grunt);

    // Making grunt default to force in order not to break the project.
    grunt.option('force', true);

    // Run like: > grunt create-server-token:dave
    grunt.registerTask('create-admin-service-token', 'Make Token', function (username) {
        var
            fs = require('fs'),
            maas = require('./lib/maas'),
            shell = require('shelljs'),
            jwt = require('jsonwebtoken');

        if (typeof username === 'undefined' || username == '') {
            console.log('Error: no subject provided for token creation');
            console.log('Usage: grunt create-admin-service-token:username');
            return;
        }

        maas.init();
        var pass = maas.config.get('private_key_pass');
        var file = maas.config.get('private_key');
        process.env.passphrase = pass;
        var command = 'openssl rsa -in ' + file + ' -passin env:passphrase';
        var privKey = shell.exec(command, {silent: true}).output;
        delete process.env.passphrase;

        console.log("Create token for: ", username);
        var token = jwt.sign({sub: username, role: 'admin'}, privKey, {algorithm: maas.config.get('jwt_signing_alg')});
        console.log(token);
    });

    grunt.registerTask('add-default-admin', 'add default admin account to the database', function () {
        var
            maas = require('./lib/maas'),
            done = this.async();

        maas.init();

        maas.User.find({username: 'mitre', roles: 'admin'}, function (err, admins) {
            if (admins && admins.length === 0) {
                var default_admin = {
                    username: 'mitre',
                    password: 'mitre1234',
                    email: 'mitre@here.com',
                    approved: true,
                    roles: ['admin']
                };
                maas.User.create(default_admin, function (err, r) {
                    if (err) {
                        console.log(err);
                        maas.shutdown();
                        done();
                    } else {
                        console.log('Created user: ', default_admin);
                        maas.shutdown();
                        done();
                    }
                });
            } else {
                console.log('Default admin already exists!');
                maas.shutdown();
                done();
            }
        });
    });

    grunt.registerTask('remove-default-admin', 'remove default admin account from the database', function () {
        var
            maas = require('./lib/maas'),
            done = this.async();

        maas.init();

        maas.User.findOne({username: 'mitre'}, function (err, defaultAdmin) {
            if (err) {
                console.log(err);
                maas.shutdown();
                done();
            } else {
                if (defaultAdmin) {
                    defaultAdmin.remove(function (errR, result) {
                        if (errR) {
                            console.log(errR);
                            maas.shutdown();
                            done();
                        } else {
                            console.log('Remove default admin: ', result);
                            maas.shutdown();
                            done();
                        }
                    });

                } else {
                    console.log('Default admin account does not exist');
                    maas.shutdown();
                    done();
                }
            }
        });
    });

    // Default task(s).
    grunt.registerTask('default', ['mochaTest']);
};
