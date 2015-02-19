hoodie-plugin-cordova-notification
==================================

This plugin watch for notification task and trigger PushNotification.

Dependencies:
-------------
hoodie-plugin-profile
hoodie-utils-plugins


Notifictions
------------
When task is intercepted by `notification:change` event, the notification schema should contains:
```
  {
    notificationType: 'requestFriend',
    from: userId,
    to: userId
  }
```

Possible notificationType:
  - requestFriend
  - acceptedFriend

## Dependencies
```shell
  hoodie install hoodie-plugin-notification
```

## Setup client
```html
  <script src="/_api/_files/hoodie.js"></script>
```
for cordova/phonegap users

```html
  <script src="<bowerdir>/hoodie/dist/hoodie.js"></script>
  <script src="<bowerdir>/hoodie-plugin-notification/hoodie.notification.js"></script>
```

