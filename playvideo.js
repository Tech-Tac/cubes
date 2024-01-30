const video = document.createElement("video");
const width = 24;
const height = 18;
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
canvas.width = width;
canvas.height = height;
const fps = 60;
const url = "Bad Apple.mp4";
const last = [];
//let timer;
let end = false;

const init = () => {
  console.log("Starting...");
  video.addEventListener("play", draw);
  video.addEventListener("loadeddata", () => {
    if (video.readyState >= 3) {
      console.log("Loaded.");
      toggleMuted(true);
      video.play();
    }
  });
  video.addEventListener("ended", () => {
    end = true;
    //clearTimeout(timer);
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
  zoomView((Math.max(width, height) * 16) / Math.min(innerWidth, innerHeight));
  pan(width * -10, height * 6);
};

let lastFrameTimestamp = 0;
const draw = (timestamp = 0) => {
  if (!end) requestAnimationFrame(draw);
  if (timestamp - lastFrameTimestamp >= 1000 / fps) {
    ctx.drawImage(video, 0, 0, width, height);
    placeFrameCubes();
    //timer = setTimeout(draw, 1000 / fps);
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
  container.innerHTML = "";
  const frame = ctx.getImageData(0, 0, width, height).data;
  let x = 0;
  let y = 0;
  for (let i = 0; i < frame.length; i += 4) {
    const pixel = [frame[i], frame[i + 1], frame[i + 2]];
    //const grayscale = (pixel[0] + pixel[1] + pixel[2]) / (255 * 3);
    //const color = grayscale >= 0.5 ? "#fff" : "#000";
    const color = rgbToHex(...pixel);
    const cube = placeCube(x, height - y, 0, color, true, false);
    cube.classList.remove("placing");
    x++;
    if (x > width - 1) {
      x = 0;
      y++;
    }
  }
};

document.addEventListener("keydown", (e) => {
  if (e.code === "KeyP" && e.ctrlKey) {
    e.preventDefault();
    init();
  }
});
