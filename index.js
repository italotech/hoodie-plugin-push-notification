/**
 * Hoodie plugin push notification
 */
var async = require('async');

module.exports = function (hoodie, callback) {
  var notification = require('./lib/notification')(hoodie);

  hoodie.task.on('notification:change', function (db, doc) {
    if (!doc._deleted && doc.notification) {
      notification.send(
        doc.notification.notificationType,
        doc.notification.from,
        doc.notification.to
      );
    }

    // console.log()
    // console.log('--------------------------------------------------------------------------------')
    // console.log(doc.notification)
    // console.log(db)
    // console.log('--------------------------------------------------------------------------------')
  });

  async.series([
    async.apply(notification.init), // init messages
  ],
  function (err) {
    if (err) console.log(err);
    callback(err);
  });

};
