// 1. 数据与当前状态

const stages = [
  {
    title: "Childhood",
    options: [
      { id: "yoyo", name: "Yo-yo" },
      { id: "toyCar", name: "Toy car" },
      { id: "pet", name: "Digital pet" }
    ]
  },
  {
    title: "School",
    options: [
      { id: "notebook", name: "Notebook" },
      { id: "pen", name: "Pen" },
      { id: "backpack", name: "Backpack" }
    ]
  },
  {
    title: "Portable electronics",
    options: [
      { id: "phone", name: "Flip phone" },
      { id: "cassettePlayer", name: "Cassette player" },
      { id: "cd", name: "CD" }
    ]
  },
  {
    title: "Home electronics",
    options: [
      { id: "computer", name: "Computer" },
      { id: "tv", name: "TV" },
      { id: "fridge", name: "Fridge" }
    ]
  },
  {
    title: "Medical equipment",
    options: [
      { id: "iv", name: "IV bag" },
      { id: "stethoscope", name: "Stethoscope" },
      { id: "thermometer", name: "Thermometer" }
    ]
  }
];

const assets = {
  // 1
  yoyo: {
    obj: "3d-assets/yoyo/yoyo.obj",
    mesh: null
  },
  toyCar: {
    obj: "3d-assets/car/car.obj",
    mesh: null
  },
  pet: {
    obj: "3d-assets/pet/pet.obj",
    mesh: null
  },

  // 2
  notebook: {
    obj: "3d-assets/blue-herbarium/blue-herbarium.obj",
    mesh: null
  },
  pen: {
    obj: "3d-assets/ripple-pen/ripple-pen.obj",
    mesh: null
  },
  backpack: {
    obj: "3d-assets/backpack/backpack.obj",
    mesh: null
  },

  // 3
  phone: {
    previewSize: 1.08217,
    previewCenter: [0, 0.15274, 0.00824],
    previewTilt: -Math.PI / 4,
    parts: {
      base: { obj: "3d-assets/phone-lid/phone-base.obj", mesh: null },
      lid: { obj: "3d-assets/phone-lid/phone-lid.obj", mesh: null }
    }
  },
  cassettePlayer: {
    previewSize: 0.88321,
    previewCenter: [-0.21945, -0.05434, -0.21156],
    previewTilt: -Math.PI / 8,
    parts: {
      tape: { obj: "3d-assets/tideline-cassette-player/cassette.obj", mesh: null },
      door: { obj: "3d-assets/tideline-cassette-player/cassette-door.obj", mesh: null },
      body: { obj: "3d-assets/tideline-cassette-player/cassette-player.obj", mesh: null }
    }
  },
  cd: {
    obj: "3d-assets/cd/cd.obj",
    mesh: null
  },

  // 4
  computer: {
    obj: "3d-assets/view-crt/view-crt.obj",
    mesh: null
  },
  tv: {
    obj: "3d-assets/tv/tv.obj",
    mesh: null
  },
  fridge: {
    obj: "3d-assets/fridge/fridge.obj",
    mesh: null
  },

  // 5
  iv: {
    obj: "3d-assets/aqua-care-iv/aqua-care-iv.obj",
    mesh: null
  },
  stethoscope: {
    obj: "3d-assets/stethoscope/stethoscope.obj",
    mesh: null
  },
  thermometer: {
    obj: "3d-assets/thermometer/thermometer.obj",
    mesh: null
  }
};

// 下标就是已选物品数。下标 0 对应初始时钟。
const clockFrames = [
  { obj: "3d-assets/clock-01/clock-01.obj", mesh: null },
  { obj: "3d-assets/clock-02/clock-02.obj", mesh: null },
  { obj: "3d-assets/clock-03/clock-03.obj", mesh: null },
  { obj: "3d-assets/clock-04/clock-04.obj", mesh: null },
  { obj: "3d-assets/clock-05/clock-05.obj", mesh: null },
  { obj: "3d-assets/clock-06/clock-06.obj", mesh: null }
];

const state = {
  view: "orbit",
  activeStage: null,
  selections: [null, null, null, null, null]
};

let orbit;
let panel;

// 2. p5 入口与界面切换

async function setup() {
  let canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  let clock = new Clock(clockFrames);

  orbit = new OrbitScene(canvas, clock, stages.length);
  panel = new InteractionPanel(chooseAsset, returnToOrbit);
  setCamera(orbit.camera);

  await clock.load();
  await loadAssets();
}

function draw() {
  background("blue");

  if (state.view === "orbit") {
    orbitControl();
    let stageIndex = orbit.updatePicking(state.selections);
    if (stageIndex !== null) {
      openStage(stageIndex);
    }
  }

  ambientLight(80, 100, 150);
  directionalLight(255, 255, 255, -0.35, 0.3, -1);
  directionalLight(85, 110, 150, 1, 0, -0.4);
  noStroke();

  if (state.view === "orbit") {
    orbit.display(state.selections);
  } else {
    let stageIndex = state.activeStage;
    panel.display(stages[stageIndex], state.selections[stageIndex]);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mouseClicked(event) {
  if (state.view === "orbit") {
    orbit.queueClick(event);
  }
}

function openStage(stageIndex) {
  state.activeStage = stageIndex;
  orbit.clearHover();

  let stage = stages[stageIndex];
  let selectedId = state.selections[stageIndex];
  if (selectedId === null) {
    state.view = "choose";
    panel.showChoices(stage);
  } else {
    state.view = "detail";
    panel.showDetail(stage, selectedId);
  }

  setCamera(panel.camera);
}

function chooseAsset(event) {
  if (state.view !== "choose") {
    return;
  }

  let optionIndex = Number(event.currentTarget.value);
  let option = stages[state.activeStage].options[optionIndex];
  state.selections[state.activeStage] = option.id;
  returnToOrbit();
}

function returnToOrbit() {
  panel.hide();
  state.view = "orbit";
  state.activeStage = null;
  orbit.pendingClick = null;
  setCamera(orbit.camera);
}

function countSelections(selections) {
  let count = 0;

  for (let index = 0; index < selections.length; index++) {
    if (selections[index] !== null) {
      count++;
    }
  }

  return count;
}

// 3. 共用的模型加载和绘制

async function loadAssets() {
  let loaded = 0;
  let total = 0;

  for (let assetName in assets) {
    let item = assets[assetName];
    let parts = [item];
    let normalize = true;

    if (item.parts) {
      parts = [];
      for (let partName in item.parts) {
        parts.push(item.parts[partName]);
      }
      normalize = false;
    }

    for (let index = 0; index < parts.length; index++) {
      let part = parts[index];
      total++;
      await loadAssetModel(part, normalize);
      if (part.mesh) {
        loaded++;
      }
    }
  }

  console.info("loading finish", loaded + "/" + total, "OBJ");
}

async function loadAssetModel(item, normalize) {
  item.mesh = await loadModel(item.obj, {
    fileType: ".obj",
    normalize: normalize,
    failureCallback: function (error) {
      console.error("loading fail", item.obj, error);
      return null;
    }
  });
}

function drawAsset(item, size) {
  push();

  if (item.parts) {
    scale(size / item.previewSize);
    rotateX(item.previewTilt);
    translate(-item.previewCenter[0], -item.previewCenter[1], -item.previewCenter[2]);

    for (let partName in item.parts) {
      let part = item.parts[partName];
      if (part.mesh) {
        model(part.mesh);
      }
    }
  } else if (item.mesh) {
    scale(size / 200);
    model(item.mesh);
  }

  pop();
}

// 4. 中央时钟与单个轨道节点

class Clock {
  constructor(frames) {
    this.frames = frames;
    this.scaleRatio = 0.33;
  }

  async load() {
    for (let index = 0; index < this.frames.length; index++) {
      await loadAssetModel(this.frames[index], false);
    }
  }

  drawingScale() {
    return min(width, height) * this.scaleRatio;
  }

  moveToHandPivot() {
    let clockScale = this.drawingScale();
    translate(0, -0.251411 * clockScale, 0.030923 * clockScale);
  }

  display(selectedCount) {
    let frame = this.frames[selectedCount];
    if (!frame || !frame.mesh) {
      return;
    }

    push();
    scale(this.drawingScale());
    model(frame.mesh);
    pop();
  }
}

class OrbitNode {
  constructor(index) {
    this.index = index;
    this.pickId = index + 1;
    this.ballRadius = 40;
  }

  display(orbitRadius, nodeCount, assetId, hoveredId, picking) {
    let angle = -HALF_PI + TWO_PI * (this.index + 0.4) / nodeCount;
    let x = cos(angle) * orbitRadius;
    let y = sin(angle) * orbitRadius;

    push();
    translate(x, y, 0);
    noStroke();

    if (picking) {
      fill(tag(this.pickId));
      sphere(this.ballRadius);
    } else if (assetId !== null) {
      drawAsset(assets[assetId], 60);
    } else {
      if (hoveredId === this.pickId) {
        emissiveMaterial(255, 120, 45);
      } else {
        emissiveMaterial(120, 225, 255);
      }
      sphere(this.ballRadius);
    }

    pop();
  }
}

// 5. 主轨道、悬停与点击拾取

class OrbitScene {
  constructor(canvas, clock, nodeCount) {
    this.canvas = canvas;
    this.camera = createCamera();
    this.clock = clock;
    this.nodes = [];
    this.pointerOnCanvas = false;
    this.hoveredId = 0;
    this.pendingClick = null;

    for (let index = 0; index < nodeCount; index++) {
      this.nodes.push(new OrbitNode(index));
    }

    // 回调执行时，用 scene 找回这一个轨道对象
    let scene = this;
    canvas.mouseOver(function () {
      scene.pointerOnCanvas = true;
    });
    canvas.mouseOut(function () {
      scene.pointerOnCanvas = false;
      scene.clearHover();
    });
  }

  clearHover() {
    this.hoveredId = 0;
    cursor(ARROW);
  }

  queueClick(event) {
    if (event.target === this.canvas.elt && mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height) {
      this.pendingClick = { x: mouseX, y: mouseY };
    }
  }

  updatePicking(selections) {
    let scene = this;
    let click = this.pendingClick;
    this.pendingClick = null;
    this.hoveredId = 0;

    function drawPickingLayer() {
      // 时钟只写入深度，挡住它背后的光球
      drawingContext.colorMask(false, false, false, false);
      scene.clock.display(countSelections(selections));
      drawingContext.colorMask(true, true, true, true);
      scene.drawRings(selections, true);
    }

    let mouseInside = this.pointerOnCanvas && mouseX >= 0 && mouseX < width && mouseY >= 0 && mouseY < height;
    if (mouseInside) {
      let id = colorPick(mouseX, mouseY, drawPickingLayer);
      if (id >= 1 && id <= this.nodes.length) {
        this.hoveredId = id;
      }
    }

    if (this.hoveredId > 0) {
      cursor(HAND);
    } else {
      cursor(ARROW);
    }

    if (click === null) {
      return null;
    }

    let id = this.hoveredId;
    if (!mouseInside || click.x !== mouseX || click.y !== mouseY) {
      id = colorPick(click.x, click.y, drawPickingLayer);
    }

    if (id >= 1 && id <= this.nodes.length) {
      return id - 1;
    }

    return null;
  }

  display(selections) {
    this.clock.display(countSelections(selections));
    this.drawRings(selections, false);
  }

  drawRings(selections, picking) {
    let radius = min(width, height) * 0.4;

    push();
    this.clock.moveToHandPivot();

    // 主轨道和节点共用这一组坐标变换
    push();
    scale(1.3);
    rotateX(-PI / 2);
    rotateZ(-PI / 6 + frameCount * 0.005);
    rotateY(0.2 + sin(frameCount * 0.003) * 0.15);

    if (!picking) {
      this.drawRing(radius, 100, 0.5);
    }

    for (let index = 0; index < this.nodes.length; index++) {
      this.nodes[index].display(radius, this.nodes.length, selections[index], this.hoveredId, picking);
    }
    pop();

    if (!picking) {
      this.drawDecorativeRings(radius);
    }

    pop();
  }

  drawDecorativeRings(radius) {
    push();
    rotateX(-PI / 2 - 0.01);
    rotateZ(PI / 6 + sin(frameCount * 0.003) * 0.4);
    rotateY(0.3 - sin(frameCount * 0.002) * 0.2);
    this.drawRing(radius, 110, 1);
    pop();

    push();
    rotateX(PI / 2 + 0.01);
    rotateZ(PI / 12 + sin(frameCount * 0.003) * 0.5);
    rotateY(0.4 + sin(frameCount * 0.002) * 0.01);
    this.drawRing(radius, 110, 4);
    pop();
  }

  drawRing(radius, opacity, weight) {
    push();
    noFill();
    stroke(120, 215, 255, opacity);
    strokeWeight(weight);
    ellipse(0, 0, radius * 2, radius * 2, 48);
    pop();
  }
}

// 6. 选择面板

class InteractionPanel {
  constructor(onChoose, onBack) {
    this.camera = createCamera();
    this.element = document.getElementById("interaction-panel");
    this.title = document.getElementById("interaction-title");
    this.optionGroup = document.getElementById("asset-options");
    this.buttons = [];

    // for (let index = 0; index < 3; index++) {
    //   let button = document.getElementById("asset-option-" + index);
    //   button.onclick = onChoose;
    //   this.buttons.push(button);
    // }

    document.getElementById("back-to-orbit").onclick = onBack;
  }

  showChoices(stage) {
    // this.title.textContent = stage.title;
    // this.optionGroup.hidden = false;
    // for (let index = 0; index < this.buttons.length; index++) {
    //   this.buttons[index].textContent = stage.options[index].name;
    // }
    // this.element.hidden = false;
  }

  // showDetail(stage, selectedId) {
  //   for (let index = 0; index < stage.options.length; index++) {
  //     let option = stage.options[index];
  //     if (option.id === selectedId) {
  //       this.title.textContent = option.name;
  //       break;
  //     }
  //   }
  //   this.optionGroup.hidden = true;
  //   this.element.hidden = false;
  // }

  hide() {
    this.element.hidden = true;
  }

  display(stage, selectedId) {
    ortho();

    if (selectedId === null) {
      let size = min(width * 0.18, height * 0.32);
      for (let index = 0; index < stage.options.length; index++) {
        let option = stage.options[index];
        push();
        translate((index - 1) * width * 0.24, 0, 0);
        // rotateY(sin(frameCount * 0.02) * 0.35);
        drawAsset(assets[option.id], size);
        pop();
      }
    } else {
      rotateY(frameCount * 0.012);
      drawAsset(assets[selectedId], min(width, height) * 0.45);
    }
  }
}
