let video = document.createElement("video");
const width = 24;
const height = 18;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
canvas.width = width;
canvas.height = height;
const defaultURL = "Bad Apple.mp4";
let end = false;
let displayCubes = [];

const init = (url = defaultURL, preview = true) => {
  enableHistory = false;
  console.log("Starting...");
  end = false;
  video.pause();
  video.remove();
  video = document.createElement("video");
  container.innerHTML = "";
  toggleMuted(true);
  displayCubes = [];
  for (let i = 0; i < width * height; i++) displayCubes.push(placeCube((i % width) - width / 2, 0, Math.floor(i / width) - height / 2, "#000", true, false));
  toggleMuted();
  video.addEventListener("play", draw);
  video.addEventListener("loadeddata", () => {
    if (video.readyState >= 3) {
      console.log("Loaded.");
      video.play();
    }
  });
  video.addEventListener("ended", () => {
    end = true;
    video.remove();
    ctx.clearRect(0, 0, width, height);
    enableHistory = true;
    putHistory();
  });
  video.src = url;
  video.style.position = "absolute";
  video.style.left = "0";
  video.style.bottom = "0";
  video.style.width = "256px";
  video.hidden = !preview;
  document.body.appendChild(video);
  video.load();

  panX = 0;
  panY = 0;
  zoom = 1;
  pan(0, 0);
  zoomView(Math.min(innerWidth, innerHeight) / (Math.max(width, height) * 75));
};

const draw = () => {
  if (!end) requestAnimationFrame(draw);
  ctx.drawImage(video, 0, 0, width, height);
  placeFrameCubes();
};

const componentToHex = (c) => {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};

const rgbToHex = (r, g, b) => {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

const placeFrameCubes = () => {
  const frame = ctx.getImageData(0, 0, width, height).data;
  for (let i = 0; i < frame.length; i += 4) {
    const p = i / 4;
    const pixel = [frame[i], frame[i + 1], frame[i + 2]];
    const color = rgbToHex(...pixel);
    displayCubes[p].color = color;
    displayCubes[p].style.backgroundColor = color;
  }
};
let isBeingRickRolled = false;

function rickRoll() {
  init("Never Gonna Give You Up.mp4", false);
  isBeingRickRolled = true;
  localStorage.setItem("gotRickRolled", true);
}
document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP" && e.ctrlKey) {
    e.preventDefault();
    init();
  }
  if (e.code === "KeyM") {
    e.preventDefault();
    video.muted = !video.muted;
  }
});

const paramName = "r";
const noRickRoll = Params.has(paramName) && ["false", "0", "no", "n", "f"].includes(Params.get(paramName).toLowerCase());
const forceRickRoll = Params.has(paramName) && !noRickRoll;

if (!noRickRoll) {
  if (forceRickRoll || !localStorage.getItem("gotRickRolled")) {
    document.addEventListener("click", () => {
      if (!isBeingRickRolled) {
        rickRoll();
      }
    });
  }
}
