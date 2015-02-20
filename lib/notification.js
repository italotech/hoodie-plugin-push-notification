var _ = require('lodash');
var async = require('async');
var utils = require('hoodie-utils-plugins')('cordova-notification:messages');
var ExtendedDatabaseAPI = utils.ExtendedDatabaseAPI;

var templateMessages = {
  'requestFriend': {
    to: '${ name } quer ser seu amigo',
  },
  'acceptedFriend': {
    from: '${ name } aceitou o seu pedido de amizade'
  }
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

  var _sendMessage = function (message, to, profiles, callback) {
    if (!message) return callback();

    var profile = profiles[to];
    console.log(profile)
    var compiledMessage = _replace(message, { name: profile.name || profile.userName });
    var registrationIDs = {
      android: [],
      ios: []
    };
    var messageObj = {
      title: 'Pedido de amizade',
      message: compiledMessage
    };
      debugger;

    Object.keys(profile.devices).forEach(function (platform) {
      Object.keys(profile.devices[platform]).forEach(function (uuid) {
        var device = profile.devices[platform][uuid];
        registrationIDs[platform].push(device.regId || device.tokenId);
      });
    });

    async.series([
      async.apply(pushService.gcmPush, messageObj, registrationIDs.android),
      async.apply(pushService.apnPush, messageObj, registrationIDs.ios)
    ], callback);
  };

  MessagesAPI.send = function (notificationType, from, to, callback) {
    // exixts message for notificationType notification?
    if (templateMessages[notificationType]) {
      _getProfile([from, to], function (err, profiles) {
        async.parallel([
          async.apply(_sendMessage, templateMessages[notificationType].to, to, profiles),
          async.apply(_sendMessage, templateMessages[notificationType].from, from, profiles)
        ], function (err) {
          console.log('done');
        });
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
