function getClientInfo(name)
{
    var client_info = {
        client_id: '688577358520.apps.googleusercontent.com',
        client_secret: 'sMK1bOt6JYpoXjCiWs5iv1Pv',
        redirect_uri: 'urn:ietf:wg:oauth:2.0:oob',
        api_key: 'AIzaSyCjA3gD62cmjoufpAvK4uYmR3ke_wsS6PI'
    };

    return client_info[name];
}

function getServerInfo(name)
{
    var server_info = {
        scope: 'https://www.googleapis.com/auth/urlshortener',
        auth: 'https://accounts.google.com/o/oauth2/auth',
        token: 'https://accounts.google.com/o/oauth2/token'
    };

    return server_info[name];
}

function shortenUrl(shortener, incognito, longUrl, callback)
{
    var s = getShortenersSetting()[shortener];

    if (!s)
        return false;

    var qs = {};
    qs.key = getClientInfo('api_key');
    if (!incognito && isAccessGranted(shortener))
        qs.access_token = s.tokens.access_token;
    qs.fields = 'id';
    var url = addQueries(s.url, qs);

    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');

    var timer = null;

    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status != 0) {
            clearTimeout(timer);

            if (this.status == 401) {
                refreshToken(
                    shortener,
                    function () {
                        shortenUrl(shortener, incognito, longUrl, callback);
                    }
                );
                return;
            }

            var response = JSON.parse(this.responseText);

            if (!response.id) {
                callback(
                    {
                        status: 'error',
                        message: response.error.message
                    }
                );
            } else {
                callback(
                    {
                        status: 'success',
                        shortUrl: response.id
                    }
                );
            }
        }
    };

    var requestBody = {};
    requestBody.longUrl = longUrl;
    xhr.send(JSON.stringify(requestBody));

    timer = setTimeout(
        function () {
            xhr.abort();
            callback(
                {
                    status: 'error',
                    message: 'Request Timed out'
                }
            );
        },
        10000
    );
}

function addQueries(url, queries)
{
    if (url[url.length - 1] != '?') {
        url += '?';
    }

    for (var i in queries) {
        url += i + '=' + encodeURIComponent(queries[i]) + '&';
    }

    if (url[url.length - 1] == '&')
        url = url.slice(0, url.length - 1);

    return url;
}

function requestTokens(code, callback)
{
    var url = getServerInfo('token');
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-Type',
                         'application/x-www-form-urlencoded');

    var timer = null;

    xhr.onreadystatechange = function () {
         if (this.readyState == 4 && this.status != 0) {
             clearTimeout(timer);

             var response = JSON.parse(this.responseText);

             if (!response.access_token ||
                 (code && !response.refresh_token)) {
                 callback(
                     {
                         status: 'error',
                         message: response.error.message
                     }
                 );
             } else {
                 callback(
                     {
                         status: 'success',
                         access_token: response.access_token,
                         refresh_token: response.refresh_token
                     }
                 );
             }
         }
    };

    var qs = {};
    qs.client_id = getClientInfo('client_id');
    qs.client_secret = getClientInfo('client_secret');

    var tokens = getShortenerItem('goo.gl', 'tokens');

    if (tokens && tokens.refresh_token) {
        qs.refresh_token = tokens.refresh_token;
        qs.grant_type = 'refresh_token';
    } else {
        qs.code = code;
        qs.redirect_uri = getClientInfo('redirect_uri');
        qs.grant_type = 'authorization_code';
    }

    var requestBody = addQueries('', qs);
    requestBody = requestBody.slice(1);

    xhr.send(requestBody);

    timer = setTimeout(
        function () {
            xhr.abort();
            callback(
                {
                    status: 'error',
                    message: 'Request Timed out'
                }
            );
        },
        10000
    );
}

function handleTokenResponse(response)
{
    if (response.status == 'error') {
        setShortenerItem('goo.gl', 'tokens', {});
        setShortenerItem('goo.gl', 'status', 'error');
        setShortenerItem('goo.gl', 'message', 'Error: ' + response.message);
        return;
    }

    var tokens;
    if (response.status == 'success') {
        tokens = getShortenerItem('goo.gl', 'tokens');
        if (!tokens)
            tokens = {};
        tokens.access_token = response.access_token;
        if (response.refresh_token)
            tokens.refresh_token = response.refresh_token;
        setShortenerItem('goo.gl', 'tokens', tokens);
        setShortenerItem('goo.gl', 'status', 'success');
        setShortenerItem('goo.gl', 'message', 'Success: Access Granted');
        return;
    }
}

function authorize()
{
    var url = getServerInfo('auth');
    var qs = {};
    qs['client_id'] = getClientInfo('client_id');
    qs['redirect_uri'] = getClientInfo('redirect_uri');
    qs['scope'] = getServerInfo('scope');
    qs['response_type'] = 'code';
    url = addQueries(url, qs);

    function onTabUpdated(currentTab, newTab, id, info, t) {
        if ((id != newTab.id) ||
            (info.status != 'complete'))
            return;

        var code, error;
        var title = t.title;
        if (title.match(/^Success/)) {
            code = (title.match(/code=(.+)$/))[1];
            chrome.tabs.move(
                t.id,
                {
                    'index' : currentTab.index
                },
                function () {
                    chrome.tabs.remove(
                        t.id,
                        function () {
                            requestTokens(
                                code,
                                function (response) {
                                    handleTokenResponse(response);
                                    updateShorteners();
                                }
                            );
                        }
                    );
                }
            );
        } else if (title.match(/^Denied/)) {
            error = (title.match(/error=(.+)$/))[1];
            chrome.tabs.move(
                t.id,
                {
                    'index' : currentTab.index
                },
                function () {
                    chrome.tabs.remove(t.id);
                }
            );
        } else {
            return;
        }

        chrome.tabs.onUpdated.removeListener();
    }

    chrome.tabs.getCurrent(
        function (currentTab) {
            chrome.tabs.create(
                {
                  url: url
                },
                function (newTab) {
                    chrome.tabs.onUpdated.addListener(
                        function (id, info, t) {
                            onTabUpdated(currentTab, newTab, id, info, t);
                        }
                    );
                }
            );
        }
    );
}

function refreshToken(shortener, callback)
{
    if (shortener == 'goo.gl') {
        requestTokens(
            false,
            function (response) {
                handleTokenResponse(response);
                callback();
            }
        );
    }
}

function grantAccess(shortener)
{
    if (shortener == 'goo.gl') {
        authorize();
    }
}

function isAccessGranted(shortener)
{
    var tokens = getShortenerItem(shortener, 'tokens');
    return tokens && tokens.access_token && tokens.refresh_token;
}

function revokeAccess(shortener)
{
    setShortenerItem(shortener, 'tokens', {});
    setShortenerItem(shortener, 'status', 'noaccess');
    setShortenerItem(shortener, 'message', 'No Access Granted');
}
