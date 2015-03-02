var _ = require('lodash');
var async = require('async');
var utils = require('hoodie-utils-plugins')('cordova-notification:messages');
var ExtendedDatabaseAPI = utils.ExtendedDatabaseAPI;

var templateMessages = {
  'requestFriend': '${ from } quer ser seu amigo',
  'acceptedFriend': '${ to } aceitou o seu pedido de amizade'
};

module.exports = function (hoodie) {
  var profileDb = new ExtendedDatabaseAPI(hoodie, hoodie.database('plugins/hoodie-plugin-profile'));
  var pushService = require('./push-service')(hoodie);
  var MessagesAPI = {};

  var _replace = function (str, vars) {
    Object.keys(vars).forEach(function (v) {
      str = str.replace(new RegExp('\\${(\\s+)?' + v + '(\\s+)?}'), vars[v]);
    });

    return str;
  };

  var _getProfile = function (userIds, callback) {
    profileDb.findSome('profile', userIds, function (err, profiles) {
      if (err) return callback(err);
      var indexedProfiles = profiles
        .map(function (v) {
          return v.doc;
        })
        .reduce(function (o, k) {
          o[k.userId] = k;
          return o;
        }, {});
      callback(null, indexedProfiles);
    });
  };

  var _sendMessage = function (notificationType, from, to, callback) {
    var message = templateMessages[notificationType];
    if (!message) return callback();

    var compiledMessage = _replace(message, {
      from: from.name || from.userName,
      to: to.name || to.userName
    });

    var registrationIDs = {
      android: [],
      ios: []
    };

    var messageObj = {
      title: 'Pedido de amizade',
      message: compiledMessage
    };

    if (!to.devices) {
      return callback();
    }

    Object.keys(to.devices).forEach(function (platform) {
      Object.keys(to.devices[platform]).forEach(function (uuid) {
        var device = to.devices[platform][uuid];
        registrationIDs[platform].push(device.regId || device.tokenId);
      });
    });

    console.log(to.name || to.userName, messageObj, registrationIDs);

    async.series([
      async.apply(pushService.gcmPush, messageObj, registrationIDs.android),
      async.apply(pushService.apnPush, messageObj, registrationIDs.ios)
    ], callback);
  };

  MessagesAPI.send = function (notificationType, from, to, callback) {
    // exixts message for notificationType notification?
    if (templateMessages[notificationType]) {
      _getProfile([from, to], function (err, profiles) {
        _sendMessage(notificationType, profiles[from], profiles[to], function (err) {
          console.log(notificationType, 'done');
        });
        // async.parallel([
        //   async.apply(_sendMessage, templateMessages[notificationType], to, profiles),
        //   async.apply(_sendMessage, templateMessages[notificationType], from, profiles)
        // ], function (err) {
        //   console.log('done');
        // });
      });
    } else {
      callback();
    }
  };

  MessagesAPI.init = function (callback) {
    pushService.init(callback);
  };

  return MessagesAPI;
};
