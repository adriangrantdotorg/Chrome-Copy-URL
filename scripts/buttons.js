function setButtonText(button, innerText)
{
    button.innerText = innerText;
}

function getButtonText(button)
{
    return button.innerText;
}

function setButtonListener(button, onClick)
{
    button.onclick = onClick;
}

function disableButton(button)
{
    button.className = 'button-disabled';
}

function enableButton(button)
{
    button.className = 'button';
}

function createButton(innerText, onClick, id)
{
    var button = document.createElement('div');
    button.className = 'button';
    button.innerText = innerText;
    if (onClick)
	button.onclick = onClick;
    if (id)
	button.id = id;

    return button;
}

function createIconButton(innerText, draw, onClick, id)
{
    var button = document.createElement('div');
    if (id)
	button.id = id;
    button.className = 'icon-container';
    
    var canvas = document.createElement('canvas');
    canvas.className = 'icon-button';
    canvas.width = 500;
    canvas.height = 500;
    canvas.innerText = innerText;

    var context = canvas.getContext('2d');
    draw(context, canvas.width, canvas.height);
    canvas.onclick = onClick;

    button.appendChild(canvas);
    return button;
}

function drawAddIconButton()
{
    var canvas = document.getElementById('add-icon');
    canvas.width = 500;
    canvas.height = 500;
    canvas.onclick = function (e) {
	createShortcut();
    };

    var c = canvas.getContext('2d');
    
    c.strokeStyle = '#070';
    c.lineWidth = canvas.width / 12;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    
    var w = canvas.width;
    var h = canvas.height;
    var lw = c.lineWidth;
    
    c.strokeRect(lw / 2, lw / 2, w - lw, h - lw);
    c.moveTo(w / 2, lw * 3);
    c.lineTo(w / 2, h - lw * 3);
    c.moveTo(lw * 3, h / 2);
    c.lineTo(w - lw * 3, h / 2);
    c.stroke();
}

function drawMoveButton(c, w, h)
{
    c.strokeStyle = '#007';
    c.fillStyle = '#007';
    c.lineWidth = w / 12;
    c.lineJoin = 'round';
    c.lineCap = 'round';

    var lw = c.lineWidth;

    function drawCircle(x, y, r) {
	c.beginPath();
	c.arc(x + r, y + r, r, 0, Math.PI * 2, false);
	c.stroke();
    }
    
    drawCircle(lw / 2, lw / 2, w / 2 - lw / 2);

    var r = (w / 2 - lw / 2) * 0.1;
    drawCircle(w / 2 - r, h / 2 - r, r);
    c.fill();

    c.beginPath();
    c.moveTo(w / 2, 2 * lw);
    c.lineTo(w / 2 - lw, 3 * lw);
    c.lineTo(w / 2 + lw, 3 * lw);
    c.lineTo(w / 2, 2 * lw);
    c.stroke();
    c.fill();

    c.beginPath();
    c.moveTo(w / 2, h - 2 * lw);
    c.lineTo(w / 2 - lw, h - 3 * lw);
    c.lineTo(w / 2 + lw, h - 3 * lw);
    c.lineTo(w / 2, h - 2 * lw);
    c.stroke();
    c.fill();
}

function drawCopyButton(c, w, h)
{
    c.strokeStyle = '#070';
    c.fillStyle = '#ffffff';
    c.lineWidth = w / 12;
    c.lineJoin = 'round';
    c.lineCap = 'round';

    var lw = c.lineWidth;

    function drawDocument(x, y, w, h, px, py) {
	c.beginPath();
	c.moveTo(x, y);
	c.lineTo(x, y + h);
	c.lineTo(x + w, y + h);
	c.lineTo(x + w, y + h * py);
	c.lineTo(x + w * px, y + h * py);
	c.lineTo(x + w * px, y);
	c.lineTo(x, y);
	c.lineTo(x, y + 1);
	c.stroke();
	c.fill();
    }

    function drawAdd(x, y, r) {
	c.beginPath();
	c.arc(x + r, y + r, r, 0, Math.PI * 2, false);
	c.moveTo(x + r, y + r * 0.3);
	c.lineTo(x + r, y + 2 * r - r * 0.3);
	c.moveTo(x + r * 0.3, y + r);
	c.lineTo(x + 2 * r - r * 0.3, y + r);
	c.stroke();
    }

    drawDocument(lw / 2, lw / 2, w * 0.75, h * 0.79, 0.7, 0.1);
    drawDocument(lw * 2, lw * 2, w * 0.75, h * 0.79, 0.7, 0.1);

    c.lineWidth = w / 20;
    drawAdd(lw * 3, h - lw * 6, lw * 2.5);
}

function drawDeleteButton(c, w, h)
{
    c.strokeStyle = '#cc0000';
    c.lineWidth = w / 10;
    c.lineJoin = 'round';
    c.lineCap = 'round';

    var p = 2;

    c.moveTo(c.lineWidth * p, c.lineWidth * p);
    c.lineTo(w - c.lineWidth * p, h - c.lineWidth * p);
    
    c.moveTo(w - c.lineWidth * p, c.lineWidth * p);
    c.lineTo(c.lineWidth * p, h - c.lineWidth * p);
    c.strokeRect(c.lineWidth / 2, c.lineWidth / 2, w - c.lineWidth, h - c.lineWidth);
    c.stroke();
}
