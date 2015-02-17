// push providers
var gcm = require('node-gcm');
var apn = require('apn');

// @todo move to plugin config
var config = {
  apn: {
    retry: 2,
    passphrase: 'YOUR PASS',
    gateway: 'gateway.sandbox.push.apple.com'
  },
  gcm: {
    retry: 2,
    key: 'YOUR KEY',
  }
};

var gcmSender;
var apnSender;

module.exports = function (hoodie) {
  var PushServiceApi = this;

  PushServiceApi.gcmPush = function (message, registrationIds) {
    if (!registrationIds.length > 0) {
      return;
    }

    var note = new gcm.Message({
      collapseKey: 'Experimento',
      delayWhileIdle: true,
      timeToLive: 3
    });

    note.addData('title', message.title);
    note.addData('message', message.message);
    gcmSender.send(note, registrationIds, config.gcm.retry);
  };

  PushServiceApi.apnPush = function (message, tokens) {
    var note = new apn.notification();
    note.badge = 1;
    note.setAlertText(message.message);
    apnSender.pushNotification(note, tokens);
  };

  PushServiceApi.init = function (callback) {
    // Setup GCM
    gcmSender = new gcm.Sender(config.gcm.key);

    // Setup APN
    // Download APN certification
    // @todo move to plugin config
    hoodie.request('GET', '/app/config/aps_distribution.p12', {}, function (req, res) {
      apnSender = new apn.connection({ pfx: res, gateway: config.apn.gateway });
      callback();
    });
  };

  return PushServiceApi;
};
