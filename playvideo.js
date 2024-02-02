const video = document.createElement("video");
const width = 24;
const height = 18;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
canvas.width = width;
canvas.height = height;
const fps = 30;
const url = "Bad Apple.mp4";
const last = [];
let end = false;
let cubes = [];

const init = () => {
  console.log("Starting...");
  container.innerHTML = "";
  toggleMuted(true);
  for (let i = 0; i < width * height; i++) cubes.push(placeCube((i % width) - width / 2, 0, Math.floor(i / width) - height / 2, "#000", true, false));
  video.addEventListener("play", draw);
  video.addEventListener("loadeddata", () => {
    if (video.readyState >= 3) {
      console.log("Loaded.");
      video.play();
    }
  });
  video.addEventListener("ended", () => {
    end = true;
    toggleMuted();
    canvas.remove();
    video.remove();
  });
  video.src = url;
  video.style.position = "absolute";
  video.style.left = "0";
  video.style.bottom = "0";
  video.style.width = "256px";
  document.body.appendChild(video);
  video.load();

  canvas.style.position = "absolute";
  canvas.style.right = "0";
  canvas.style.bottom = "0";
  canvas.style.width = "256px";
  canvas.style.imageRendering = "pixelated";
  document.body.appendChild(canvas);

  panX = 0;
  panY = 0;
  zoom = 1;
  pan(0, 0);
  zoomView(Math.min(innerWidth, innerHeight) / (Math.max(width, height) * 75));
};

let lastFrameTimestamp = 0;
const draw = (timestamp = 0) => {
  if (!end) requestAnimationFrame(draw);
  if (timestamp - lastFrameTimestamp >= 1000 / fps) {
    ctx.drawImage(video, 0, 0, width, height);
    placeFrameCubes();
    lastFrameTimestamp = timestamp;
  }
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
    const grayscale = (pixel[0] + pixel[1] + pixel[2]) / (255 * 3);
    const color = rgbToHex(...pixel);
    cubes[p].color = color;
    cubes[p].style.backgroundColor = color;
    cubes[p].style.setProperty("--y", grayscale);
  }
};

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP" && e.ctrlKey) {
    e.preventDefault();
    init();
  }
});
