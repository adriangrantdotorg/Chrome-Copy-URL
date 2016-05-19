function constructContextMenus()
{
    setContextMenusEnable('true');

    var contextMenusFormat = getContextMenusFormat();
    chrome.contextMenus.removeAll(
        function () {
            var parent = chrome.contextMenus.create(
                {
                    title: 'Copy URL+',
                    contexts: ['page', 'link', 'selection']
                }
            );

            var s = getShortcuts();
            for (var i = 0; i < s.length; i++) {
                // if (s[i].enable != 'true')
                //    continue;
                createContextMenu(
                    parent,
                    contextMenusFormat,
                    {
                        format: s[i].format,
                        shortener: s[i].shortener,
                        key: s[i].key
                    }
                );
            }
        }
    );
}

function getTitleByUrl(url, callback)
{
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);

    var timer = null;
    xhr.onreadystatechange = function () {
        var re, match;

        if (this.readyState == 4 && this.status != 0) {
            if (this.status == 200) {
                clearTimeout(timer);
                re = new RegExp('<title>(.*?)</title>', 'i');
                match = this.responseText.match(re);
                if (match)
                    callback(match[1]);
                else
                    callback('');
            } else {
                callback('');
            }
        }
    };

    xhr.send();

    timer = setTimeout(function () { callback(''); }, 10000);
}

function contextMenuOnClick(values, includeTitle)
{
    var format = values.format;
    var shortener = values.shortener;

    return function (info, tab) {
        function sendRequest(request) {
            chrome.tabs.sendRequest(tab.id, request);
        }

        function copyAndNotify(text) {
            copyToClipBoard(text);
            notify(text + ' copied to clipboard', sendRequest);
        }

        if (info.linkUrl && includeTitle) {
            notify('Extracting the title of ' + info.linkUrl + ' ...', sendRequest);
            getTitleByUrl(
                info.linkUrl,
                function (title) {
                    parseFormat(
                        format,
                        {
                            title: title,
                            url: info.linkUrl,
                            text: info.selectionText
                        },
                        shortener,
                        tab,
                        sendRequest,
                        copyAndNotify
                    );
                }
            );
            return;
        }

        parseFormat(
            format,
            {
                title: tab.title,
                url: info.linkUrl ? info.linkUrl : info.pageUrl,
                text: info.selectionText
            },
            shortener,
            tab,
            sendRequest,
            copyAndNotify
        );
    };
}

function createContextMenu(parent, titleFormat, values)
{
    var re;
    for (var i in values) {
        re = new RegExp('\\$\\{' + i + '\\}', 'ig');
        titleFormat = titleFormat.replace(re, escape(values[i]));
    }
    var title = unescape(titleFormat);

    var includeTitle = false;
    re = new RegExp('\\$\\{' + 'title' + '\\}', 'ig');
    if (title.match(re))
        includeTitle = true;

    var contexts = [];
    re = new RegExp('\\$\\{' + 'text' + '\\}', 'ig');
    if (title.match(re)) {
        contexts.push('selection');
    } else {
        contexts.push('page');
        contexts.push('link');
    }

    var onclick = contextMenuOnClick(values, includeTitle);
    if (!onclick)
        return;

    var properties = {};

    properties.title = title;
    properties.onclick = onclick;
    properties.contexts = contexts;
    if (parent)
        properties.parentId = parent;

    chrome.contextMenus.create(properties);
}
