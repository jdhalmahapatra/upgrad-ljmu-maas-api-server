
'use strict';

var
    maas = require('./lib/maas'),
    config = require('./lib/config'),
    path = require('path'),
    vmManager = require('./lib/cloud/vm-manager');

// Bootup maas object
maas.init();

var app = require('./lib/console/express')();

// Run an interval to terminate expired VMs (those that have been idle for too long)
vmManager.startExpirationInterval();

var port = maas.config.get('port');

if (maas.config.isEnabled('enable_ssl')) {
    var https = require('https');
    var fs = require('fs');

    var options = maas.config.get('tls_options');

    var server = https.createServer(options, app);
    server.listen(port);

    maas.logger.info('maas REST API running on port %d with SSL', port);
} else {
    app.listen(port);
    maas.logger.info('maas REST API running on port %d', port);
}
