
'use strict';

var
    maas = require('./maas'),
    smtpTransport = require('nodemailer').createTransport("SMTP", {
        host: maas.config.get("smtp:host"),
        port: maas.config.get("smtp:port"),
        secureConnection: maas.config.get("smtp:secure_connection"),
        auth: {
            user: maas.config.get("smtp:username"),
            pass: maas.config.get("smtp:password")
        }
    });


/**
 * Helper to send the mail...
 * @param options
 */
function mailIt(options) {
    /**
     * We only send email if the host field is defined
     */
    if (maas.config.get("smtp:host")) {
        smtpTransport.sendMail(options, function (error, responseStatus) {
            if (error) {
                console.log("Error sending email to user: ", error);
            }
        });
    }
}

/**
 * Send mail to the User (usually on a 'signup' an account approval)
 * @param email
 */
exports.sendToUser = function (email) {
    var opts = {
        from: 'noreplay@maasadmin', // sender address
        to: email, // list of receivers
        subject: "maas Account Approved",
        text: "Your maas account has been approved."
    };
    mailIt(opts);
};

/**
 *  Send email to admin as set on the config file.  Usually sent when a user signs up
 */
exports.sendToAdmin = function () {
    var opts = {
        from: 'noreplay@maasadmin', // sender address
        to: maas.config.get("smtp:admin_email"),
        subject: "maas: Pending user account",
        text: "A User has registered with maas. Please check the maas admin console for pending maas accounts"
    };
    mailIt(opts);
};