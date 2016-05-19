function initTabs()
{
    var tabs = [
        'shortcuts',
        'contextMenus',
        'shorteners',
        'notifications',
        'changelog'
    ];

    for (var i = 0; i < tabs.length; i++) {
        var tab = document.getElementById(tabs[i] + 'Tab');
        tab.onclick = tabOnClick(tabs, tabs[i]);
    }
}

function tabOnClick(tabs, name)
{
    return function (e) {
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i] === name) {
                document.getElementById(tabs[i] + 'Tab').className = 'selected';
                document.getElementById(tabs[i] + 'Body').className = 'option-body visible';
            } else {
                document.getElementById(tabs[i] + 'Tab').className = 'unselected';
                document.getElementById(tabs[i] + 'Body').className = 'hidden';
            }
        }
    };
}

function initButtons()
{
    drawAddIconButton();

    var contextMenusFormat = document.getElementById('context-menus-format');
    if (contextMenusFormat)
        contextMenusFormat.innerText = getContextMenusFormat();

    function updateContextMenus(e) {
        chrome.extension.getBackgroundPage().constructContextMenus();
        alert('Context menus have been updated.');
    }

    function disableAllContextMenus(e) {
        setContextMenusEnable('false');
        chrome.contextMenus.removeAll(
            function () {
                alert('All context menus have been deleted.');
            }
        );
    }

    function inputOnChange(e) {
        setContextMenusFormat(e.target.value);
        e.target.blur();
    }

    function contextMenusFormatOnClick(e) {
        var elem = e.target;
        var old = getButtonText(elem);
        setButtonText(elem, '');

        var input = document.createElement('input');
        input.type = 'text';
        input.className = 'format';

        input.onclick = function (e) {
            e.stopPropagation();
        };

        input.onchange = inputOnChange;

        input.onkeydown = function (e) {
            if (isReturn(e.which))
                e.target.blur();
        };

        input.onblur = function (e) {
            elem.removeChild(e.target);
            setButtonText(elem, e.target.value);
        };

        input.value = old;
        elem.appendChild(input);
        input.select();
    }

    var b = {
        'add': function (e) {
            createShortcut();
        },
        'disable-all': function (e) {
            disableAllShortcuts();
        },

        'update-context-menus1': updateContextMenus,
        'update-context-menus2': updateContextMenus,
        'disable-all-context-menus1': disableAllContextMenus,
        'disable-all-context-menus2': disableAllContextMenus,
        'context-menus-format': contextMenusFormatOnClick,

        'default': function (e) {
            restoreDefaultShortcuts();
        },
        'revoke-all': function (e) {
            revokeAllShortenersAccesses();
        }
    };

    for (var i in b)
        document.getElementById(i).onclick = b[i];
}

function initNotifications()
{
    var s = getNotificationsStyles();

    function onClick(style) {
        return function (e) {
            notificationsStyleOnClick(style);
        };
    }

    for (var i = 0; i < s.length; i++) {
        var b = document.getElementById('notification-' + s[i]);
        if (!b)
            continue;
        b.onclick = onClick(s[i]);
    }

    var input = document.getElementById('notification-time');
    if (!input)
        return;

    input.onchange = function (e) {
        var time = parseFloat(e.target.value);
        if (time == NaN)
            return;
        setNotificationsTime(time);
    };

    input.onkeydown = function (e) {
        if (isReturn(e.which))
            e.target.blur();
    };
}

function createShortcut()
{
    addShortcut(0, getDefaultShortcut());
    updateShortcuts();
}

function disableAllShortcuts()
{
    var s  = getShortcuts();
    for (var i = 0; i < s.length; i++)
        s[i].enable = 'false';

    setShortcuts(s);
    updateShortcuts();
}

function restoreDefaultShortcuts()
{
    function confirmDefault() {
        return window.confirm(
            'All keyboard shortcut settings will be defaulted.'
        );
    }

    if (confirmDefault())  {
        setDefaultShortcuts();
        updateShortcuts();
    }
}

function confirmDuplicate()
{
    return window.confirm(
        'This shortcut key is already in use.\n'
            + 'This shortcut will be enabled and '
            + 'the other will be disabled.'
    );
}

function enableOnChange(name, index)
{
    return function () {
        var keystr, duplicate;

        var old = getShortcutItem(index, name);
        if (old == 'true') {
            setShortcutItem(index, name, 'false');
        } else {
            keystr = getShortcutItem(index, 'key');
            duplicate = getEnabledShortcutIndexByKey(keystr);
            if (duplicate !== false) {
                if (confirmDuplicate()) {
                    setShortcutItem(duplicate, name, 'false');
                    setShortcutItem(index, name, 'true');
                    updateShortcuts();
                    return;
                } else {
                    updateShortcuts();
                    return;
                }
            }
            setShortcutItem(index, name, 'true');
        }
    };
}

function markUpEnable(name, value, index)
{
    var checkbox = document.createElement('input');
    checkbox.type = 'checkbox';

    if (value == 'true')
        checkbox.checked = true;
    else
        checkbox.checked = false;

    checkbox.onchange = enableOnChange(name, index);

    return checkbox;
}

function inputOnChange(name, index)
{
    return function (e) {
        setShortcutItem(index, name, e.target.value);
        e.target.blur();
    };
}

function formatOnClick(name, index)
{
    return function (e) {
        var elem = e.target;
        var old = getButtonText(elem);
        setButtonText(elem, '');

        var input = document.createElement('input');
        input.type = 'text';
        input.className = name;

        input.onclick = function (e) {
            e.stopPropagation();
        };

        input.onchange = inputOnChange(name, index);

        input.onkeydown = function (e) {
            if (isReturn(e.which))
                e.target.blur();
        };

        input.onblur = function (e) {
            elem.removeChild(e.target);
            setButtonText(elem, e.target.value);
        };

        input.value = old;
        elem.appendChild(input);
        input.select();
    };
}

function markUpFormat(name, value, index)
{
    return createButton(value, formatOnClick(name, index), false);
}

function markUpShortener(name, value, index)
{
    var button = createButton(value, null, false);
    disableButton(button);
    return button;
}

function shortcutKeySettingListener(e, elem, index)
{
    var key = e.which;

    if (isEscape(key)) {
        enableButton(elem);
        setButtonText(elem, getShortcutItem(index, 'key'));
        document.onkeydown = null;
        return;
    }

    if (!(isAlphaNum(key) || isSpecialKey(key)))
        return;

    var keystr = keyCodeToString(
        key, e.ctrlKey, e.shiftKey, e.altKey, e.metaKey
    );
    var duplicate = getEnabledShortcutIndexByKey(keystr);

    if (duplicate !== false && duplicate !== index &&
        getShortcutItem(index, 'enable') === 'true') {
        if (confirmDuplicate()) {
            setShortcutItem(duplicate, 'enable', 'false');
            setShortcutItem(index, 'key', keystr);
            document.onkeydown = null;
            updateShortcuts();
            return;
        } else {
            enableButton(elem);
            setButtonText(elem, getShortcutItem(index, 'key'));
            document.onkeydown = null;
            return;
        }
    }

    enableButton(elem);
    setButtonText(elem, keystr);
    document.onkeydown = null;

    setShortcutItem(index, 'key', keystr);
}

function keyOnClick(name, index)
{
    return function (e) {
        var elem = e.target;

        disableButton(elem);
        setButtonText(elem, 'press keys...');

        document.onkeydown = function (e) {
            document.onclick = null;
            shortcutKeySettingListener(e, elem, index);
        };

        document.onclick = function (e) {
            document.onclick = null;
            document.onkeydown = null;
            enableButton(elem);
            setButtonText(elem, getShortcutItem(index, 'key'));
        };

        e.stopPropagation();
    };
}

function markUpKey(name, value, index)
{
    return createButton(value, keyOnClick(name, index), false);
}

function moveHereOnClick(name, fromIndex, toIndex)
{
    return function (e) {
        moveShortcut(fromIndex, toIndex);
        updateShortcuts();
    };
}

function moveToListener(e)
{
    if (!isEscape(e.which))
        return;

    document.onkeydown = null;
    updateShortcuts();
}

function moveOnClick(name, index)
{
    return function (e) {
        var move = document.getElementById(name + '.' + index);
        move.className = 'button-disabled';
        move.innerHTML = '&#187;';

        var n = getNumberOfShortcuts();
        for (var i = 0; i < n; i++) {
            if (i != index) {
                move = document.getElementById(name + '.' + i);
                move.innerHTML = '';
                move.className = 'button';
                move.innerText = 'here';
                move.onclick = moveHereOnClick(name, index, i);
            }
        }

        document.onkeydown = function (e) {
            document.onclick = null;
            moveToListener(e);
        };

        document.onclick = function (e) {
            document.onclick = null;
            document.onkeydown = null;
            updateShortcuts();
        };

        e.stopPropagation();
    };
}

function markUpMove(name, index)
{
    return createIconButton(
        'move',
        drawMoveButton,
        moveOnClick(name, index),
        name + '.' + index
    );
}

function copyOnClick(name, index)
{
    return function (e) {
        copyShortcut(index, index);
        updateShortcuts();
    };
}


function markUpCopy(name, index)
{
    return createIconButton(
        'copy',
        drawCopyButton,
        copyOnClick(name, index),
        false
    );
}

function deleteOnClick(name, index)
{
    return function (e) {
        deleteShortcut(index);
        updateShortcuts();
    };
}

function markUpDelete(name, index)
{
    return createIconButton(
        'delete',
        drawDeleteButton,
        deleteOnClick(name, index),
        false
    );
}

function markUpShortcut(row, shortcut, index)
{
    var items = [
        ['move', markUpMove],
        ['enable', markUpEnable],
        ['format', markUpFormat],
        ['shortener', markUpShortener],
        ['key', markUpKey],
        ['copy', markUpCopy],
        ['delete', markUpDelete]
    ];

    var cell, name, markUp;
    for (var i = 0; i < items.length; i++) {
        name = items[i][0];
        markUp = items[i][1];
        cell = row.insertCell(-1);
        cell.className = name;
        if (shortcut[name])
            cell.appendChild(markUp(name, shortcut[name], index));
        else
            cell.appendChild(markUp(name, index));
    }
}

function getShortcutsTableBody()
{
    return document.getElementById('shortcutsTableBody');
}

function updateShortcuts()
{
    var tbody = getShortcutsTableBody();
    var len = tbody.rows.length;
    for (var i = 0; i < len; i++)
        tbody.deleteRow(0);

    var row;
    var s = getShortcuts();
    for (i = 0; i < s.length; i++) {
        row = tbody.insertRow(-1);
        markUpShortcut(row, s[i], i);
    }
}

function getShortenersTableBody()
{
    return document.getElementById('shortenersTableBody');
}

function markUpShortenerName(name, setting, shortener)
{
    var div = document.createElement('div');
    div.className = name;
    div.innerHTML = shortener.link(setting.site);

    return div;
}

function markUpStatus(name, setting, shortener)
{
    var div = document.createElement('div');
    div.className = name + '-' + setting.status;
    div.innerText = setting.message;

    return div;
}

function grantOnClick(shortener)
{
    return function (e) {
        grantAccess(shortener);
    };
}

function markUpGrant(name, setting, shortener)
{
    var button = createButton('Grant Access', null, false);

    if (!isAccessGranted(shortener))
        setButtonListener(button, grantOnClick(shortener));
    else
        disableButton(button);

    return button;
}

function revokeOnClick(shortener)
{
    return function (e) {
        revokeAccess(shortener);
        updateShorteners();
    };
}

function markUpRevoke(name, setting, shortener)
{
    var button = createButton('Revoke Access', null, false);

    if (isAccessGranted(shortener))
        setButtonListener(button, revokeOnClick(shortener));
    else
        disableButton(button);

    return button;
}

function markUpShortenerSetting(row, setting, shortener)
{
    var items = [
        ['shortener', markUpShortenerName],
        ['status', markUpStatus],
        ['grant', markUpGrant],
        ['revoke', markUpRevoke]
    ];

    var cell;
    for (var i = 0; i < items.length; i++) {
        cell = row.insertCell(-1);
        cell.className = items[i][0];
        cell.appendChild((items[i][1])(items[i][0], setting, shortener));
    }
}

function revokeAllShortenersAccesses()
{
    var s = getShortenersSetting();

    for (var i in s)
        revokeAccess(i);

    updateShorteners();
}

function updateShorteners()
{
    var tbody = getShortenersTableBody();
    var len = tbody.rows.length;
    for (var i = 0; i < len; i++)
        tbody.deleteRow(0);

    var row;
    var s = getShortenersSetting();
    for (i in s) {
        row = tbody.insertRow(-1);
        markUpShortenerSetting(row, s[i], i);
    }
}

function updateNotifications()
{
    var s = getNotificationsStyle();
    var styles = getNotificationsStyles();

    var radio;
    for (var i = 0; i < styles.length; i++) {
        radio = document.getElementById('notification-' + styles[i]);
        radio.checked = (styles[i] == s);
    }

    var input = document.getElementById('notification-time');
    if (!input)
        return;

    var time = getNotificationsTime();
    input.value = time;
}

function notificationsStyleOnClick(name)
{
    var styles = getNotificationsStyles();

    setNotificationsStyle(name);

    var radio;
    for (var i = 0; i < styles.length; i++) {
        if (styles[i] != name) {
            radio = document.getElementById('notification-' + styles[i]);
            radio.checked = false;
        }
    }
}

function init()
{
    initTabs();
    initButtons();
    initNotifications();
    updateShortcuts();
    updateShorteners();
    updateNotifications();
}

// do initialization once the DOM has fully loaded
document.addEventListener('DOMContentLoaded', function () {
    init();
});
