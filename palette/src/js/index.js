import rgbToHex from './rgbConverter';

const controlMode = new Map([
  [0, 'fill'],
  [1, 'color'],
  [2, 'pencil'],
]);
const hotkeyBindings = {
  KeyB: 'fill',
  KeyP: 'pencil',
  KeyC: 'color',
};
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const controls = document.querySelectorAll('.controls__control-btn');
const controlsList = controls[0].closest('ul');
const colorInput = document.querySelector('input[type="color"]');
const colorInputLbl = colorInput.closest('label');
const prevColorBtn = document.querySelector('.colors__color--previous .colors__color-btn');
const presetBtns = document.querySelectorAll('.colors__preset button');
const presetBtnsColors = ['#ff0000', '#0000ff'];
// const labels = document.querySelectorAll('.picture-controls__label');
const pixelSize = 32;
const clearBtn = document.querySelector('#clear');
const activeClass = 'controls__control-btn--active';
const [canvasWidth, canvasHeight] = [window.getComputedStyle(canvas).getPropertyValue('width').split('px')[0], window.getComputedStyle(canvas).getPropertyValue('height').split('px')[0]];
let mode = "pencil";


function switchMode(newMode) {
  if (newMode === undefined) throw new Error('Unknown app mode.');
  mode = newMode;
}

let fillColor = colorInput.value;
canvas.width = 512 / pixelSize;
canvas.height = 512 / pixelSize;

function getMousePos(evt) {
  return {
    x: Math.floor(evt.offsetX / pixelSize),
    y: Math.floor(evt.offsetY / pixelSize),
  };
}

function updateColorPalette() {
  colorInputLbl.style.backgroundColor = colorInput.value;
}

function saveColorPalette() {
  localStorage.setItem('mainColor', fillColor);
  localStorage.setItem('prevColor', rgbToHex(prevColorBtn.style.backgroundColor));
}

function changeColor(newColor, saveAfterChange = true) {
  [colorInput.value, prevColorBtn.style.backgroundColor] = [newColor, fillColor];
  fillColor = colorInput.value;
  updateColorPalette();
  if (saveAfterChange) saveColorPalette();
}

function line(x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let err = (dx > dy ? dx : -dy) / 2;

  while (!(x0 === x1 && y0 === y1)) {
    ctx.fillRect(x0, y0, 1, 1);
    const e2 = err;
    if (e2 > -dx) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dy) {
      err += dx;
      y0 += sy;
    }
  }
  ctx.fillRect(x1, y1, 1, 1);
}

let lastCoords = {};

function pressedMouseMoveHandler(evt) {
  const {
    x,
    y,
  } = getMousePos(evt);
  lastCoords = lastCoords.x ? lastCoords : {
    x,
    y,
  };
  ctx.fillStyle = fillColor;
  line(lastCoords.x, lastCoords.y, x, y);
  lastCoords.x = x;
  lastCoords.y = y;
}


function updateControls(e, evtCode) {
  controls.forEach((el) => el.classList.remove(activeClass));
  if (evtCode) {
    const key = controlsList.querySelector(`*[data-key=${evtCode}]`);
    if (key) key.classList.add(activeClass);
  } else {
    e.target.classList.add(activeClass);
  }
}

function saveCanvas() {
  localStorage.setItem('canvasData', canvas.toDataURL());
}

function mouseLeaveHandler(e) {
  canvas.removeEventListener('mousemove', pressedMouseMoveHandler);

  function calculateLeaveCoords(event) {
    // console.log(event.offsetX, event.offsetY);


    const leaveCoords = {};
    if (event.offsetX < canvasWidth && event.offsetX > 0) {
      leaveCoords.x = event.offsetX / pixelSize;
    } else if (event.offsetX >= canvasWidth) {
      // console.log('w')
      leaveCoords.x = (canvasWidth) / pixelSize;
    } else {
      leaveCoords.x = 0;
    }

    if (event.offsetY < canvasHeight && event.offsetY > 0) {
      leaveCoords.y = event.offsetY / pixelSize;
      // console.log('h')
    } else if (event.offsetY >= canvasHeight) {
      leaveCoords.y = (canvasHeight) / pixelSize;
    } else {
      leaveCoords.y = 0;
    }

    leaveCoords.x = Math.floor(leaveCoords.x);
    leaveCoords.y = Math.floor(leaveCoords.y);

    return leaveCoords;
  }

  const leaveCoords = calculateLeaveCoords(e);

  line(lastCoords.x, lastCoords.y, leaveCoords.x, leaveCoords.y);
  lastCoords = {};
  saveCanvas();
  canvas.removeEventListener('mouseleave', mouseLeaveHandler);
}

function getPixelHexColor(pixelPos) {
  const color = ctx.getImageData(pixelPos.x, pixelPos.y, 1, 1).data.slice(0, 3);
  return rgbToHex(`rgb(${color.join(',')}`);
}

canvas.addEventListener('mousedown', (evt) => {
  if (mode === 'pencil') {
    canvas.addEventListener('mousemove', pressedMouseMoveHandler);
    const coordinates = getMousePos(evt);
    ctx.fillStyle = fillColor;
    ctx.fillRect(coordinates.x, coordinates.y, 1, 1);

    canvas.addEventListener('mouseleave', mouseLeaveHandler);
  }

  if (mode === 'fill') {
    const fillHandler = (e) => {
      ctx.fillStyle = fillColor;
      floodFill(getMousePos(e).x, getMousePos(e).y);
      canvas.removeEventListener('click', fillHandler);
      saveCanvas();
    };
    canvas.addEventListener('click', fillHandler);
  }
  if (mode === 'color') {
    const colorClickHandler = (e) => {
      const colorHex = getPixelHexColor(getMousePos(e));
      changeColor(colorHex);
      controls[2].click();
      canvas.removeEventListener('click', colorClickHandler);
    };
    canvas.addEventListener('click', colorClickHandler);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const dataURL = localStorage.getItem('canvasData');
  if (dataURL) {
    const img = new Image();
    img.src = dataURL;
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
    };
  }
});

canvas.addEventListener('mouseup', () => {
  if (mode === 'pencil') {
    canvas.removeEventListener('mousemove', pressedMouseMoveHandler);
    saveCanvas();
    lastCoords = {};
  }
});

controlsList.addEventListener('click', (e) => updateControls(e));

controls.forEach((control, index) => {
  control.addEventListener('click', () => {
    switchMode(controlMode.get(index));
  });
});


document.addEventListener('keydown', (evt) => {
  switchMode(hotkeyBindings[evt.code]);
  updateControls(evt, evt.code);
});


colorInput.addEventListener('change', () => {
  prevColorBtn.style.backgroundColor = fillColor;
  changeColor(colorInput.value);
});

presetBtns.forEach((btn, index) => {
  btn.addEventListener('click', () => {
    changeColor(presetBtnsColors[index]);
  });
});

function init() {
  controls[2].click();
  changeColor(localStorage.getItem('mainColor') || '#000000', false);
  prevColorBtn.style.backgroundColor = localStorage.getItem('prevColor') || '#90ee90';
}
init();

prevColorBtn.addEventListener('click', () => {
  changeColor(rgbToHex(prevColorBtn.style.backgroundColor));
  updateColorPalette();
});

let pixelStack;

function floodFill(startX, startY) {
  debugger;
  let startColor = getPixelHexColor({
    x: startX,
    y: startY
  });
  pixelStack = [
    [startX, startY]
  ];

  while (pixelStack.length) {
    let newPos;
    let x;
    let y;
    let pixelPos;
    let reachLeft;
    let reachRight;
    newPos = pixelStack.pop();
    [x, y] = newPos;
    pixelPos = {
      x,
      y,
    };

    while (pixelPos.y >= 0 && matchStartColor(pixelPos)) {
      pixelPos.y -= 1;
    }
    pixelPos.y += 1;
    reachLeft = false;
    reachRight = false;
    while (pixelPos.y < (canvas.height) && matchStartColor(pixelPos)) {
      ctx.fillRect(pixelPos.x, pixelPos.y, 1, 1);

      if (pixelPos.x > 0) {
        if (matchStartColor({
            x: pixelPos.x - 1,
            y: pixelPos.y,
          })) {
          if (!reachLeft) {
            pixelStack.push([pixelPos.x - 1, pixelPos.y]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      if (pixelPos.x < canvas.width) {
        if (matchStartColor({
            x: pixelPos.x + 1,
            y: pixelPos.y,
          })) {
          if (!reachRight) {
            pixelStack.push([pixelPos.x + 1, pixelPos.y]);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      pixelPos.y += 1;
    }
  }

  function matchStartColor(pixelPos) {
    const currentPixelColor = getPixelHexColor(pixelPos);
    console.log(currentPixelColor === startColor);
    return currentPixelColor === startColor;
  }
}
