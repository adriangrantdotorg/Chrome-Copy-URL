function notify(message, sendRequest)
{
    var notifiers = {
        web: notifyByWebNotifications,
        tooltip: notifyByTooltip
    };

    var style = getNotificationsStyle();
    if (style == 'none')
        return;

    var time = getNotificationsTime();
    if (notifiers[style])
        notifiers[style](message, time * 1000, sendRequest);
}

function notifyByTooltip(message, time, sendRequest)
{
    sendRequest(
        {
            status: 'notification',
            message: message,
            time: time
        }
    );
}

function notifyByWebNotifications(message, time, sendRequest)
{
    var notification = webkitNotifications.createNotification(
        '../icons/icon48.png',
        'Copy URL+',
        message
    );

    function cancelNotification(obj) {
        setTimeout(function () { obj.cancel(); }, time);
    }

    notification.ondisplay = cancelNotification(notification);
    notification.show();
}
