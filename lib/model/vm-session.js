
'use strict';

module.exports = VMSessionModel;

/**
 *  Define the VMSession Model Schema.
 *
 */
function VMSessionModel(mongoose) {

    // Schema definition
    var VMSessionSchema = new mongoose.Schema({
        username: {
            type: String,
            unique: true,
            required: true
        },
        expireAt: {
            type: Date
        },
        // maintains VM session state; if this is 0 the session is active and the user is connected to the VM,
        // otherwise this is the time the user disconnected
        lastAction: {
            type: Date
        },
        connectTime: {
            type: Date
        }
    });

    return mongoose.model('VMSession', VMSessionSchema);
};