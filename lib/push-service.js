// push providers
var gcm = require('node-gcm');
var apn = require('apn');

// config
var config;

module.exports = function (hoodie) {
  var gcmSender;
  var apnSender;
  var PushServiceApi = this;

  PushServiceApi.gcmPush = function (message, registrationIds, cb) {
    if (!registrationIds.length > 0) {
      return cb();
    }

    var note = new gcm.Message({
      collapseKey: 'Experimento',
      delayWhileIdle: true,
      timeToLive: 3
    });

    note.addData('title', message.title);
    note.addData('message', message.message);
    gcmSender.send(note, registrationIds, config.gcm.retry);

    return cb();
  };

  PushServiceApi.apnPush = function (message, tokens, cb) {
    var note = new apn.notification();
    note.badge = 1;
    note.setAlertText(message.message);
    apnSender.pushNotification(note, tokens);

    return cb();
  };

  PushServiceApi.init = function (callback) {
    config = hoodie.config.get('push_notification_config');

    if (!config) {
      config = {
        apn: {
          retry: 2,
          production: false,
          passphrase: 'XXX',
          gateway: 'gateway.sandbox.push.apple.com',
          pfx: './certs/apn_pfx_sandbox.p12'
        },
        gcm: {
          retry: 2,
          key: 'XXX'
        }
      };

      hoodie.config.set('push_notification_config', config);
    }

    // Setup GCM
    gcmSender = new gcm.Sender(config.gcm.key);

    var fs = require('fs');
    var body = '';
    var forge = require('node-forge');
    var buffer = forge.util.createBuffer();
    function onData(err, chunk) {
      buffer.putBytes(chunk.toString('binary'));
    };


    // Setup APN
    // Download APN certification
    apnSender = new apn.Connection({
      production: config.apn.production,
      passphrase: config.apn.passphrase,
      pfx: config.apn.pxf,
      gateway: config.apn.gateway
    });
    callback();
  };

  return PushServiceApi;
};
