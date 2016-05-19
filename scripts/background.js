function copyToClipBoard(text)
{
    var input = document.getElementById('content');
    if (!input)
        return;

    input.value = text;
    input.select();

    document.execCommand('copy', false, null);
}

function onRequest(request, sender, sendResponse)
{
    var format = getEnabledFormatByKey(request.keystr);
    if (!format) {
        sendResponse({});
        return;
    }

    sendResponse({});

    function sendRequest(request) {
        chrome.tabs.sendRequest(sender.tab.id, request);
    }

    var shortener = getShortenerByKey(request.keystr);
    parseFormat(
        format,
        request.values,
        shortener,
        sender.tab,
        sendRequest,
        function (text) {
            copyToClipBoard(text);
            notify(text + ' copied to clipboard', sendRequest);
        }
    );
}

function parseFormat(format, values, shortener, tab, sendRequest, callback)
{
    var re;
    for (var i in values) {
        re = new RegExp('\\$\\{' + i + '\\}', 'ig');
        format = format.replace(re, escape(values[i]));
    }

    re = new RegExp('\\$\\{' + 'n' + '\\}', 'ig');
    format = format.replace(re, '\n');

    if (!shortener)
        return callback(unescape(format));

    re = new RegExp('\\$\\{' + 'sURL' + '\\}', 'ig');
    if (format.match(re)) {
        notify('Shortening ' + values.url + ' ...', sendRequest);
        return getShortUrl(
            shortener,
            values.url,
            tab,
            sendRequest,
            function (shortUrl) {
                format = format.replace(re, escape(shortUrl));
                callback(unescape(format));
            }
        );
    }

    callback(unescape(format));
}

function getShortUrl(shortener, longUrl, tab, sendRequest, callback)
{
    shortenUrl(
        shortener,
        tab.incognito,
        longUrl,
        function (response) {
            if (response.status == 'success')
                callback(response.shortUrl);
            else if (response.status == 'error')
                notify('Error: ' + response.message, sendRequest);
        }
    );
}

function init()
{
    if (getContextMenusEnabled() == 'true')
        constructContextMenus();
    chrome.extension.onRequest.addListener(onRequest);
}

// do initialization once the DOM has fully loaded
document.addEventListener('DOMContentLoaded', function () {
    init();
});
