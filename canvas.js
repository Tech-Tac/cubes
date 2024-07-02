class Cube {
  constructor(x = 0, y = 0, z = 0, color = "#f00") {
    this.x = x;
    this.y = y;
    this.z = z;
    this.color = color;
  }
}

class CubeMap {
  constructor(cubes = []) {
    this.cubes = cubes;
  }
  sort() {
    return this.cubes.sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z));
  }
  getCubeAt(x, y, z) {
    return this.cubes.filter((c) => c.x === x && c.y === y && c.z === z)[0];
  }
  placeCube(x = 0, y = 0, z = 0, color = "#f00") {
    if (!this.getCubeAt(x, y, z)) {
      this.cubes.push(new Cube(x, y, z, color));
      this.sort();
      console.log("Placed a cube at ", x, y, z, " with color ", color);
      return true;
    } else {
      console.log("A cube already exists at ", x, y, z);
      return false;
    }
  }
  removeCubeAt(x, y, z) {
    this.cubes.splice(
      this.cubes.findIndex((c) => c.x === x && c.y === y && c.z === z),
      1
    );
    this.sort();
  }
  removeCube(cube) {
    this.cubes.splice(
      this.cubes.findIndex((c) => c === cube),
      1
    );
    this.sort();
  }
}

class CubeView extends CubeMap {
  constructor(canvas = new HTMLCanvasElement(), cubes = []) {
    super(cubes);
    this.canvas = canvas;
    this.background = "#888";
    this.panX = 0;
    this.panY = 0;
    this.zoom = 1;

    canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });
    canvas.addEventListener("wheel", (e) => {
      if ((this.zoom < canvas.width / 100 && e.deltaY < 0) || (this.zoom > 0.1 && e.deltaY > 0)) {
        this.zoom *= 1 + (canvas.width / 500) * e.deltaY * -0.001;
        this.panX += ((e.offsetX - this.canvas.width / 2) / this.canvas.width) * e.deltaY * 0.05;
        this.panY += ((e.offsetY - this.canvas.height / 2) / this.canvas.height) * e.deltaY * 0.05;
        if (this.zoom > canvas.width / 100) this.zoom = canvas.width / 100;
        if (this.zoom < 0.1) this.zoom = 0.1;
        this.draw();
      }
    });

    let panning = false;
    canvas.addEventListener("pointerdown", (e) => {
      const cube = this.getCubeAtScreen(e.offsetX, e.offsetY);
      if (e.button === 0) {
        const pos = this.screenToMap(e.offsetX, e.offsetY);
        this.placeCube(pos.x, 0, pos.z, "#f0f");
        panning = true;
      } else if (e.button === 2 && cube) {
        this.removeCube(cube);
      } else if (e.button === 1 && cube) {
        this.color = cube.color;
      }
      this.draw();
    });
    document.addEventListener("pointermove", (e) => {
      if (panning) {
        this.panX += e.movementX / this.zoom;
        this.panY += e.movementY / this.zoom;
      }
      this.draw();
    });
    document.addEventListener("pointerup", (e) => {
      panning = false;
      this.draw();
    });
  }
  get center() {
    return { x: this.canvas.width * 0.5 + this.panX * this.zoom, y: this.canvas.height * 0.5 + this.panY * this.zoom };
  }
  mapToScreen(x, y, z) {
    return { x: this.center.x + (x - z) * 50 * this.zoom, y: this.center.y + (x + z) * 25 * this.zoom - y * 50 * this.zoom };
  }
  screenToMap(x, y) {
    return {
      x: Math.round(((x - (this.canvas.width / 2 + this.panX * this.zoom)) / (50 * this.zoom) + (y - (this.canvas.height / 2 + this.panY * this.zoom)) / (25 * this.zoom)) / 2),
      z: Math.round(((y - (this.canvas.height / 2 + this.panY * this.zoom)) / (25 * this.zoom) - (x - (this.canvas.width / 2 + this.panX * this.zoom)) / (50 * this.zoom)) / 2),
    };
  }
  getCubeAtScreen(x, y) {
    const ctx = canvas.getContext("2d");
    for (let i = this.cubes.length - 1; i >= 0; i--) {
      const c = this.cubes[i];
      const pos = this.mapToScreen(c.x, c.y, c.z);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y - 50 * this.zoom);
      ctx.lineTo(pos.x + 50 * this.zoom, pos.y - 25 * this.zoom);
      ctx.lineTo(pos.x + 50 * this.zoom, pos.y + 25 * this.zoom);
      ctx.lineTo(pos.x, pos.y + 50 * this.zoom);
      ctx.lineTo(pos.x - 50 * this.zoom, pos.y + 25 * this.zoom);
      ctx.lineTo(pos.x - 50 * this.zoom, pos.y - 25 * this.zoom);
      if (ctx.isPointInPath(x, y)) {
        return c;
      }
    }
  }
  draw(canvas = this.canvas) {
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = this.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const c of this.cubes) {
      const pos = this.mapToScreen(c.x, c.y, c.z);
      ctx.beginPath();
      ctx.fillStyle = c.color;
      ctx.moveTo(pos.x, pos.y - 50 * this.zoom);
      ctx.lineTo(pos.x + 50 * this.zoom, pos.y - 25 * this.zoom);
      ctx.lineTo(pos.x + 50 * this.zoom, pos.y + 25 * this.zoom);
      ctx.lineTo(pos.x, pos.y + 50 * this.zoom);
      ctx.lineTo(pos.x - 50 * this.zoom, pos.y + 25 * this.zoom);
      ctx.lineTo(pos.x - 50 * this.zoom, pos.y - 25 * this.zoom);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#0008";
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x + 50 * this.zoom, pos.y - 25 * this.zoom);
      ctx.lineTo(pos.x + 50 * this.zoom, pos.y + 25 * this.zoom);
      ctx.lineTo(pos.x, pos.y + 50 * this.zoom);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#0004";
      ctx.moveTo(pos.x, pos.y + 50 * this.zoom);
      ctx.lineTo(pos.x - 50 * this.zoom, pos.y + 25 * this.zoom);
      ctx.lineTo(pos.x - 50 * this.zoom, pos.y - 25 * this.zoom);
      ctx.lineTo(pos.x, pos.y);
      ctx.fill();
    }
  }
}
const canvas = document.getElementById("view");
const view = new CubeView(canvas);
view.placeCube(0, 2, 0, "#f00");
view.placeCube(0, 1, 0, "#0f0");
view.placeCube(0, 0, 0, "#00f");
view.draw();

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  view.draw();
}

window.addEventListener("load", resize);
window.addEventListener("resize", resize);
