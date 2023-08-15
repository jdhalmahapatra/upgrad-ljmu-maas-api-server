'use strict'

var
    program = require('commander'),
    maas = require('./lib/maas'),
    shell = require('shelljs'),
    ms = require('ms'),
    toDate = require('to-date'),
    uuid = require('node-uuid'),
    jwt = require('jsonwebtoken');

program.version(require('./package.json').version)
       .usage('[options] <username>')
       .option('-a --admin', 'Create a token with the admin role')
       .option('-e --expires <n>', 'Token validity time. Ex: 1d, 3h, 30m, 60s, etc.');

program.parse(process.argv);

if (process.argv.length <= 2) {
    program.help();
}

if (program.args.length != 1) {
    program.help();
}
var username = program.args[0];

maas.init();
var pass = maas.config.get('private_key_pass');
var file = maas.config.get('private_key');
process.env.passphrase = pass;
var command = 'openssl rsa -in ' + file + ' -passin env:passphrase';
var privKey = shell.exec(command, {silent: true}).output;
delete process.env.passphrase;

var options = {
    sub: username,
    jti: uuid.v4(),
    iss: require('os').hostname()
};
if (program.admin) options.role = 'admin';
if (program.expires) options.exp = Math.floor((Date.now() + ms(program.expires)) / 1000);
//if (program.expires) options.exp = Math.floor(toDate(ms(program.expires) / 1000).seconds.fromNow / 1000);

console.log("Creating token: ", JSON.stringify(options));
var token = jwt.sign(options, privKey, {algorithm: maas.config.get('jwt_signing_alg')});
console.log(token);

process.exit();
