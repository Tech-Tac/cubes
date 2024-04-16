const view = document.getElementsByClassName("view")[0];
const world = document.getElementsByClassName("world")[0];
const container = document.getElementsByClassName("cube-container")[0];
const colorPicker = document.getElementsByClassName("color-picker")[0];
const rotator = document.getElementsByClassName("rotator")[0];
const saveBtn = document.getElementsByClassName("btn-save")[0];
const loadBtn = document.getElementsByClassName("btn-load")[0];
const helpBtn = document.getElementsByClassName("btn-help")[0];
const helpDialog = document.getElementById("dlg-help");
const closeBtn = document.getElementsByClassName("btn-close")[0];
const file = document.getElementById("file");

let currColor = "#ff0000";
let isPanning = false;
let rotation = 0;
let panX = 0;
let panY = 0;
let zoom = 1;
let history = [];
let historyIndex = 0;
let isBreaking = false;
let isPicking = false;
let muted = false;

let initialFingerDistance = 0;
let initialScale = 1;
let currentScale = 1;
let isPinching = false;
let isDragging = false;
let dragStartY = 0;

function getCubes() {
  return document.querySelectorAll(".cube:not(.breaking)");
}

function angleFromPoints(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

function rotCoords(x, z, rot = rotation) {
  if (rot === 0) return { x: x, z: z };
  else if (rot === 90) return { x: z, z: x * -1 };
  else if (rot === 180) return { x: x * -1, z: z * -1 };
  else if (rot === 270) return { x: z * -1, z: x };
}

function worldCoords(screenX, screenY) {
  return rotCoords(
    Math.round(((screenX - (innerWidth / 2 + panX * zoom)) / (45 * zoom) + (screenY - (innerHeight / 2 + panY * zoom)) / (25 * zoom)) / 2),
    Math.round(((screenY - (innerHeight / 2 + panY * zoom)) / (25 * zoom) - (screenX - (innerWidth / 2 + panX * zoom)) / (45 * zoom)) / 2)
  );
}

function getCubeAt(x, y, z) {
  const cubes = getCubes();
  for (const cube of cubes) {
    if (cube.style.getPropertyValue("--x") == x && cube.style.getPropertyValue("--y") == y && cube.style.getPropertyValue("--z") == z) {
      return cube;
    }
  }
}

function serialize() {
  let frags = [];
  const cubes = getCubes();
  for (const cube of cubes) {
    frags.push([cube.style.getPropertyValue("--x"), cube.style.getPropertyValue("--y"), cube.style.getPropertyValue("--z"), cube.color].join(","));
  }
  return frags.join(";");
}

function deserialize(string, animate = true, animationLength = 200) {
  clear(false);
  toggleMuted(true);
  const cubeStrings = string.split(";");
  if (animate) {
    cubeStrings.forEach((c, i) => setTimeout(() => placeCube(...c.split(","), true, false), (animationLength / cubeStrings.length) * i));
    setTimeout(() => {
      addHistory();
      toggleMuted(false);
    }, animationLength);
  } else {
    cubeStrings.forEach((c, i) => placeCube(...c.split(","), true, false));
    addHistory();
    toggleMuted(false);
  }
}

function clear(addToHistory = true) {
  toggleMuted(true);
  for (const cube of getCubes()) {
    breakCube(cube, false);
  }
  if (addToHistory) addHistory();
  toggleMuted(false);
}

function save() {
  storeSave();
  const a = document.createElement("a");
  a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(serialize()));
  a.setAttribute("download", "cubes.cubes");
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function open(file) {
  if (file) {
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (e) => {
      deserialize(e.target.result);
    };
    reader.onerror = (e) => {
      alert("Error reading file.\nError : " + e.target.error);
    };
  }
}

function storeSave() {
  localStorage.setItem("save", serialize());
}
function getStoredSave() {
  return localStorage.getItem("save");
}

function addHistory(force = false) {
  const cubes = getCubes();
  if (force || getHistory() != cubes) {
    if (historyIndex > 0) {
      history.length -= historyIndex;
      historyIndex = 0;
    }
    history.push(cubes);
    storeSave();
  }
}

function getHistory() {
  return history[history.length - historyIndex - 1];
}

function putCubes(cubes) {
  container.replaceChildren(...cubes);
  storeSave();
}

function putHistory() {
  putCubes(getHistory());
}

function copyCubes() {
  window.navigator.clipboard.writeText(serialize()).then(() => {
    alert("Copied!");
  });
}

async function pasteCubes() {
  deserialize(await window.navigator.clipboard.readText());
}

function undo(steps = 1) {
  if (history.length > historyIndex + steps) {
    historyIndex += steps;
    putHistory();
  }
}
function redo(steps = 1) {
  if (historyIndex >= steps) {
    historyIndex -= steps;
    putHistory();
  }
}

function reorganize() {
  let cubes = getCubes().entries();
  cubes.sort((a, b) => {
    a.style.getPropertyValue("--x") + a.style.getPropertyValue("--y") + a.style.getPropertyValue("--z");
  });
}

function toggleMuted(state) {
  muted = state ?? !muted;
  localStorage.setItem("muted", muted);
}

function playSound(sound = "cube.wav") {
  if (!muted) {
    const audio = new Audio("./" + sound);
    audio.play();
    return audio;
  } else return false;
}

function setColor(color) {
  colorPicker.value = currColor = color;
}
function pickColor(cube) {
  setColor(cube.color);
}

function placeCube(x, y, z, color = currColor, force = false, addToHistory = true) {
  if (force || !getCubeAt(x, y, z)) {
    x -= 0;
    y -= 0;
    z -= 0;
    const cube = document.createElement("div");
    cube.className = "cube placing";
    cube.style.setProperty("--x", x);
    cube.style.setProperty("--y", y);
    cube.style.setProperty("--z", z);
    cube.color = color;
    cube.style.backgroundColor = color;

    function placeAdjacent(e) {
      const angle = angleFromPoints(45, 50, e.offsetX, e.offsetY);
      let newX = 0;
      let newY = 0;
      let newZ = 0;
      if (angle > -2.5829933382462307 && angle <= -0.4636476090008061) newY++;
      else if (angle > -0.4636476090008061 && angle <= 1.5707963267948966) newX++;
      else if (angle > 1.5707963267948966 || angle <= 2.5829933382462307) newZ++;
      const rotated = e.shiftKey ? rotCoords(-newX, -newZ) : rotCoords(newX, newZ);
      if (e.shiftKey) newY *= -1;
      placeCube(x + rotated.x, y + newY, z + rotated.z);
    }

    function breakFunction() {
      if (!isPinching) {
        breakCube(cube);
        isBreaking = true;
        started = false;
      }
    }

    let breakTimeout;
    let started = false;
    cube.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch" && !isPinching) {
        if (e.button == 0) placeAdjacent(e);
        else if (e.button == 2) {
          breakCube(cube);
          isBreaking = true;
        } else if (e.button == 1) pickColor(cube);
      } else if (e.pointerType === "touch" && !isPinching) {
        started = true;
        breakTimeout = setTimeout(breakFunction, 250);
      }
    });
    cube.addEventListener("pointerup", (e) => {
      clearTimeout(breakTimeout);
      isBreaking = false;
      if (e.pointerType === "touch" && started) {
        placeAdjacent(e);
      }
      started = false;
    });

    cube.addEventListener("pointerenter", () => {
      if (isBreaking) breakTimeout = setTimeout(breakFunction, 100);
      if (isPicking) pickColor(cube);
    });
    cube.addEventListener("pointerleave", () => {
      clearTimeout(breakTimeout);
    });

    container.appendChild(cube);
    if (addToHistory) addHistory();
    setTimeout(() => cube.classList.remove("placing"), 100);
    playSound();
    console.log("Placed a cube at ", x, y, z, " with color ", color);
    return cube;
  }
}

function breakCube(cube, addToHistory = true) {
  cube.classList.add("breaking");
  setTimeout(() => {
    cube.classList.remove("breaking");
    cube.remove();
  }, 150);
  if (addToHistory) addHistory();
  playSound();
}

function pan(x, y) {
  panX += x / zoom;
  panY += y / zoom;
  world.style.setProperty("transform-origin", -panX + "px " + -panY + "px");
  world.style.setProperty("translate", panX + "px " + panY + "px");
}

function zoomView(scale) {
  world.style.scale = zoom = Math.max(0.1, Math.min(10, scale));
}

function rotate(angle) {
  rotation = Math.round(angle / 90) * 90;
  if (rotation >= 360 || rotation < 0) rotation -= Math.floor(rotation / 360) * 360;
  for (let a = 0; a <= 4; a++) world.classList.remove("rot-" + a * 90);
  world.classList.add(`rot-${rotation}`);
  rotator.value = rotation;
  return rotation;
}

function getURL() {
  const url = new URL(window.location.href.split("?")[0]);
  url.searchParams.set("c", serialize());
  return url.href;
}

function share() {
  const url = getURL();
  window.navigator.clipboard.writeText(url).then(() => {
    alert("Copied link: \n" + url);
  });
  window.history.pushState(document.title, "", url);
}

let downPos = { x: 0, y: 0 };
view.addEventListener("pointerdown", (e) => {
  if (e.target === view && !e.altKey) {
    isPanning = true;
    downPos = { x: e.clientX, y: e.clientY };
  } else if (e.altKey) {
    isDragging = true;
    dragStartY = e.target.style.getPropertyValue("--y") || 0;
  }
});
view.addEventListener("pointermove", (e) => {
  if (isPanning) {
    pan(e.movementX, e.movementY);
  }
  if (isDragging) {
    const worldPos = worldCoords(e.clientX, e.clientY + dragStartY * 50 * zoom);
    placeCube(worldPos.x, dragStartY, worldPos.z);
  }
});
view.addEventListener("pointerup", (e) => {
  if (!isPinching && isPanning && e.target === view && e.button !== 2 && e.clientX - downPos.x === 0 && e.clientY - downPos.y === 0) {
    const worldPos = worldCoords(e.clientX, e.clientY);
    placeCube(worldPos.x, 0, worldPos.z);
  }
  if (isPicking && !isPinching) {
    const elementAt = document.elementFromPoint(e.clientX, e.clientY);
    if (elementAt.classList.contains("cube")) {
      pickColor(elementAt);
    }
  }
  isPanning = false;
  isBreaking = false;
  isPicking = false;
  isDragging = false;
});

view.addEventListener("wheel", (e) => {
  zoom *= 1 + e.deltaY * -0.005;
  zoom = Math.round(zoom * 10) / 10;
  if (zoom < 0.1) zoom = 0.1;
  else if (zoom > 10) zoom = 10;
  else pan((e.clientX - innerWidth / 2) * -0.1 * zoom, (e.clientY - innerHeight / 2) * -0.1 * zoom);
  world.style.scale = zoom;
});

colorPicker.addEventListener("pointerdown", (e) => {
  isPicking = true;
});

view.addEventListener("contextmenu", (e) => e.preventDefault());
rotator.addEventListener("input", (e) => rotate(rotator.value));
colorPicker.addEventListener("input", (e) => {
  currColor = colorPicker.value;
});
saveBtn.addEventListener("click", save);
file.addEventListener("input", (e) => open(file.files[0]));
file.addEventListener("click", () => {
  file.value = null;
});

function handleTouchStart(event) {
  if (event.touches.length === 2) {
    isPinching = true;
    initialFingerDistance = getFingerDistance(event.touches[0], event.touches[1]);
    initialScale = currentScale;
    world.classList.remove("animate");
  }
}

function handleTouchMove(event) {
  if (isPinching && event.touches.length === 2) {
    const newFingerDistance = getFingerDistance(event.touches[0], event.touches[1]);
    const scale = (newFingerDistance / initialFingerDistance) * initialScale;
    currentScale = Math.min(Math.max(0.1, scale), 10);

    const deltaX = event.touches[1].pageX - event.touches[0].pageX;
    const deltaY = event.touches[1].pageY - event.touches[0].pageY;

    zoomView(currentScale);
  }
}

function handleTouchEnd() {
  isPinching = false;
  world.classList.add("animate");
}

function getFingerDistance(touch1, touch2) {
  const dx = touch1.pageX - touch2.pageX;
  const dy = touch1.pageY - touch2.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

view.addEventListener("touchstart", handleTouchStart);
view.addEventListener("touchmove", handleTouchMove);
view.addEventListener("touchend", handleTouchEnd);

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyC" && e.ctrlKey) {
    e.preventDefault();
    copyCubes();
  }
  if (e.code === "KeyV" && e.ctrlKey) {
    e.preventDefault();
    pasteCubes();
  }
  if (e.code === "KeyZ" && e.ctrlKey) {
    e.preventDefault();
    undo();
  }
  if (e.code === "KeyY" && e.ctrlKey) {
    e.preventDefault();
    redo();
  }
  if (e.code === "KeyS" && e.ctrlKey) {
    e.preventDefault();
    save();
  }
  if (e.code === "KeyO" && e.ctrlKey) {
    e.preventDefault();
    file.click();
  }
  if (e.code === "KeyR" && e.ctrlKey) {
    e.preventDefault();
    clear();
  }
  if (e.code === "KeyC" && e.ctrlKey && e.shiftKey) {
    e.preventDefault();
    share();
  }
  if (e.code === "Comma") {
    e.preventDefault();
    rotate(rotation - 90);
  }
  if (e.code === "Period") {
    e.preventDefault();
    rotate(rotation + 90);
  }
  if (e.code === "ArrowLeft") {
    e.preventDefault();
    pan(25 * zoom, 0);
  }
  if (e.code === "ArrowRight") {
    e.preventDefault();
    pan(-25 * zoom, 0);
  }
  if (e.code === "ArrowUp") {
    e.preventDefault();
    pan(0, 25 * zoom);
  }
  if (e.code === "ArrowDown") {
    e.preventDefault();
    pan(0, -25 * zoom);
  }
  if (e.code === "NumpadAdd") {
    e.preventDefault();
    zoomView(zoom * 1.25);
  }
  if (e.code === "NumpadSubtract") {
    e.preventDefault();
    zoomView(zoom * 0.75);
  }
  if (e.code === "KeyM") {
    e.preventDefault();
    toggleMuted();
  }
});

helpBtn.addEventListener("click", () => helpDialog.showModal());
closeBtn.addEventListener("click", () => helpDialog.close());

window.addEventListener("load", () => {
  rotate(rotation);
  setColor(currColor);
  toggleMuted(localStorage.getItem("muted") === "true");
  const lastSave = getStoredSave();
  const urlParameter = new URLSearchParams(window.location.search);
  if (urlParameter.has("c")) deserialize(urlParameter.get("c"));
  else if (lastSave) deserialize(lastSave);
  else placeCube(0, 0, 0);
});
