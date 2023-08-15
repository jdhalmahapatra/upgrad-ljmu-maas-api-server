/**
 * @exports maas
 */
var maas = {};

module.exports = maas;

/**
 * Current version used. Read from package.json
 * @type {String}
 */
maas.VERSION = require('../package.json').version;

/**
 * Called at start of App.  Initializes the core modules
 */
maas.init = function() {

    /**** Setup ****/

    // Winston and wrap in out global name space
    maas.logger = require('./logger');
    maas.logger.beforeConfig();


    // Config with validation
    maas.config = require('./config');
    maas.config.init();

    maas.logger.afterConfig();

    var cloud = maas.config.get('cloud_platform');
    if (cloud === "openstack") {
        maas.cloud = require('./cloud/openstack');
    } else if (cloud === "aws") {
        maas.cloud = require('./cloud/aws');
    }
    maas.cloud.init();

    // Mongoose with Q wrapper
    maas.mongoose = require('mongoose-q')(require('mongoose'));

    if(!maas.mongoose.connection.db) {
        var dbname;

        if(process.env.NODE_ENV === 'production') {
            dbname = maas.config.get('db:production');
        } else {
            dbname = maas.config.get('db:test');
        }
        maas.mongoose.connect(dbname);
        maas.logger.info("Mongoose:  connected to: " + dbname);

        maas.mongoose.connection.on('error',function (err) {
            maas.logger.error("Problem connecting to mongdb. Is it running? " + err );
            process.exit(1);
        });
        maas.mongoose.connection.on('disconnected', function () {
            maas.logger.info("Mongoose:  disconnected connection");
        });

    }
    // Model
    maas.User = require('./model/user')(maas.mongoose);
    maas.VMSession = require('./model/vm-session')(maas.mongoose);

    // used to lock out users who fail authentication too many times
    maas.lockout = require('./lockout');
};

/**
 * Shut down. Closes DB connection and cleans up any temp config settings
 */
maas.shutdown = function() {
    maas.config.reset();

    if(maas.mongoose.connection){
        maas.mongoose.connection.close();
    }
}
