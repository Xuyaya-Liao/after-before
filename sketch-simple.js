// ===== 物品（class）=====
// class 必须写在 stages 前面：stages 一创建就会运行 new Item(...)，class 不会被提升。

class Item {
  constructor(name, files) {
    this.name = name;     // 物品名字
    this.files = files;   // 要加载的 OBJ 路径（数组）
    this.models = [];     // 加载好的模型放这里，一开始是空的
  }

  // 每件物品的 OBJ 已经居中，并统一成 200 单位的最大边长。
  async load(assetInfo) {
    this.artwork = await loadImage(assetInfo.atlas);
    this.clearModels = [];

    for (let part of assetInfo.parts) {
      if (part.opaque) {
        this.models.push(await loadModel(part.file, { fileType: ".obj", normalize: false }));
      }

      let clearFile = assetInfo.translucent[part.file];
      if (clearFile) {
        this.clearModels.push(await loadModel(clearFile, { fileType: ".obj", normalize: false }));
      }
    }
  }

  // 所有物品从同一个正面开始，再以自己的几何中心轻轻转动。
  float() {
    rotateX(sin(frameCount * 0.003) * 0.14);
    rotateY(sin(frameCount * 0.004) * 0.4);
  }

  draw(size) {
    push();
    this.float();

    push(); noFill(); stroke(255); box(size); pop();//测试用
    scale(size / 200);
    noStroke();
    noLights(); // 光泽和颜色已经画进纹理，避免网页灯光把配色压暗。
    texture(this.artwork);
    for (let part of this.models) {
      model(part);
    }

    if (this.clearModels.length > 0) {
      // 透明壳在内部零件之后画，让背后的零件可见。
      let gl = drawingContext;
      let wroteDepth = gl.getParameter(gl.DEPTH_WRITEMASK);
      gl.depthMask(false);
      for (let part of this.clearModels) {
        model(part);
      }
      gl.depthMask(wroteDepth);
    }
    pop();
  }

  drawDetail() {
    this.draw(min(width, height)*0.4)
  }

  click() {
  }
}


// ===== 数据 =====

// 五个阶段，每个阶段三件物品
const stages = [
  {
    title: "Childhood",
    items: [
      new Item("Yo-yo", ["3d-assets/yoyo/yoyo.obj"]),
      new Item("Toy car", ["3d-assets/car/car.obj"]),
      new Item("Digital pet", ["3d-assets/pet/pet.obj"])
    ]
  },
  {
    title: "School",
    items: [
      new Item("Notebook", ["3d-assets/blue-herbarium/blue-herbarium.obj"]),
      new Item("Pen", ["3d-assets/ripple-pen/ripple-pen.obj"]),
      new Item("Backpack", ["3d-assets/backpack/backpack.obj"])
    ]
  },
  {
    title: "Portable electronics",
    items: [
      new Item("Flip phone", ["3d-assets/phone-lid/phone-base.obj", "3d-assets/phone-lid/phone-lid.obj"]),
      new Item(
        "Cassette player",
        [
          "3d-assets/tideline-cassette-player/cassette.obj",
          "3d-assets/tideline-cassette-player/cassette-door.obj",
          "3d-assets/tideline-cassette-player/cassette-player.obj"
        ]
      ),
      new Item("CD", ["3d-assets/cd/cd.obj"])
    ]
  },
  {
    title: "Home electronics",
    items: [
      new Item("Computer", ["3d-assets/view-crt/view-crt.obj"]),
      new Item("TV", ["3d-assets/tv/tv.obj"]),
      new Item("Fridge", ["3d-assets/fridge/fridge.obj"])
    ]
  },
  {
    title: "Medical equipment",
    items: [
      new Item("IV bag", ["3d-assets/aqua-care-iv/aqua-care-iv.obj"]),
      new Item("Stethoscope", ["3d-assets/stethoscope/stethoscope.obj"]),
      new Item("Thermometer", ["3d-assets/thermometer/thermometer.obj"])
    ]
  }
];

// 六个时钟模型
let clocks = [];

// 玩家在每个阶段选中的物品。null 表示这个阶段还没选
let chosen = [null, null, null, null, null];

// 现在显示哪个画面
let view = "orbit";
// 当前stage
let activeStage = 0;
// 鼠标下面是第几颗球
let hovered = 0;

// 两台相机：轨道和选择
let orbitCam;
let choiceCam;

// 轨道相机：zoom 是滚轮调的距离倍数，lookX / lookY 是相机现在的偏移
let zoom = 1.5;
let lookX = 0;
let lookY = 0;

// 返回按钮
let backButton;


// ===== p5 入口 =====

async function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  orbitCam = createCamera();
  choiceCam = createCamera();
  setCamera(orbitCam);

  backButton = createButton("Back to orbit");
  backButton.id("back");
  backButton.mouseClicked(backToOrbit);
  backButton.hide();

  //=================== load所有的model ===================
  // 加载六个时钟：clock-01 到 clock-06
  for (let i = 1; i <= 6; i++) {
    let path = "3d-assets/clock-0" + i + "/clock-0" + i + ".obj";
    let clock = await loadModel(path, { fileType: ".obj", normalize: false });
    clocks.push(clock);
  }

  // 加载 15 件物品，共用同一套尺寸、坐标和贴图规则。
  let propMaterials = await loadJSON("3d-assets/prop-materials.json");
  for (let s = 0; s < stages.length; s++) {
    let items = stages[s].items;
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      await item.load(propMaterials[item.files[0]]);
    }
  }
  //===================== load所有的model ===================

  console.log("all models loaded");
}

function draw() {
  background("blue");

  if (view === "orbit") {
    moveOrbitCamera();
    updateHover(drawPickLayer); // 要在开灯之前做，灯光会改变编号颜色
    setLights();
    drawClock(); //调用drawClock函数在画布中心画clock
    drawOrbit(false); //调用drawOrbit函数在画布中心画轨道和光球
  } else if(view === "choose"){
    updateHover(drawChoicePickLayer); //当显示选取视图，调用drawChoicePickLayer版本
    setLights();
    drawChoices(false);
  }else if(view === "detail"){
    setLights()
    chosen[activeStage].drawDetail()
  }
}

// 控制 orbit 界面视角跟随鼠标晃动
function moveOrbitCamera() {
  let targetX = map(mouseX, 0, width, 150, -150, true);
  let targetY = map(mouseY, 0, height, 150, -150, true);

  lookX = lerp(lookX, targetX, 0.05);
  lookY = lerp(lookY, targetY, 0.05);

  let distance = (height / 2) / tan(PI / 6) * zoom;
  orbitCam.camera(lookX, lookY, distance, 0, 0, 0, 0, 1, 0);
}

// p5 在滚动滚轮时自动调用
function mouseWheel(event) {
  if (view === "orbit") {
    zoom += event.delta * 0.0005;
    zoom = constrain(zoom, 1.2, 2);
  }
  return false; // 阻止页面滚动
}

//设定灯光
function setLights() {
  ambientLight(80, 100, 150);
  directionalLight(255, 255, 255, -0.35, 0.3, -1);
  directionalLight(85, 110, 150, 1, 0, -0.4);
  noStroke();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 检测点击选取
function mouseClicked() {
  if (view === "orbit" && hovered > 0) {
    openStage(hovered - 1); // 球的编号从 1 开始，阶段下标从 0 开始
  } else if (view === "choose" && hovered > 0) {
    // 物品编号从 1 开始，items 下标从 0 开始，所以 hovered - 1
    chosen[activeStage] = stages[activeStage].items[hovered - 1];
    backToOrbit();
  }else if(view === "detail"){
    chosen[activeStage].click()
  }
}


// ===== 切换画面 =====

function openStage(stageIndex) {
  if(chosen[stageIndex] == null){
  view = "choose";
  }else {
    view = "detail"
  }
  activeStage = stageIndex;
  hovered = 0;
  cursor(ARROW);

  backButton.show();
  setCamera(choiceCam);
  // 平行投影：远近一样大，三件物品看起来整齐。
  // 设在相机上，而不是在 drawChoices 里每帧调用 ortho()，因为 colorPick 里调用 ortho() 会算错。
  choiceCam.ortho();
}

function backToOrbit() {
  view = "orbit";
  backButton.hide();
  setCamera(orbitCam);
  hovered = 0; // 清掉三选一画面留下的编号，避免下一次点击误开阶段
}


// ===== 鼠标悬停（GPU 拾取）=====

// colorPick 会在看不见的地方把 layer 画一遍：
// 每个可点的东西涂成自己编号的颜色，再读出鼠标下面那个点的颜色，就知道点的是谁。
// layer 是一个函数：轨道画面传 drawPickLayer，三选一画面传 drawChoicePickLayer。
function updateHover(layer) {
  hovered = colorPick(mouseX, mouseY, layer);

  if (hovered > 0) {
    cursor(HAND);
  } else {
    cursor(ARROW);
  }
}

function drawChoicePickLayer() {
  drawChoices(true);
}

function drawPickLayer() {
  // 时钟只写入“深度”、不写颜色：看不见，但能挡住它背后的球
  drawingContext.colorMask(false, false, false, false);
  drawClock();
  drawingContext.colorMask(true, true, true, true);

  drawOrbit(true);
}


// ===== 时钟 =====

// 数已经选了几件(决定时钟状态和背景的鱼)
function countChosen() {
  let count = 0;
  for (let i = 0; i < chosen.length; i++) {
    if (chosen[i] !== null) {
      count++;
    }
  }
  return count;
}

// 时钟画多大。轨道也要用它来找到指针转轴的位置。
function clockSize() {
  return min(width, height) * 0.33;
}

function drawClock() {
  push();
  scale(clockSize());
  model(clocks[countChosen()]);
  pop();
}


// ===== 轨道和光球 =====

// picking 为 true 时是给 colorPick 画的：只画编号球，不画圆环
function drawOrbit(picking) {
  let radius = min(width, height) * 0.5; 

  push();
  // 把原点移到时钟指针的转轴上，轨道就绕着指针转
  translate(0, -0.251411 * clockSize(), 0.030923 * clockSize());

  // 主轨道：一个圆环 + 五颗光球，用同一组旋转
  push();
  scale(1.4);
  rotateX(-PI / 2);
  rotateZ(-PI / 6 + frameCount * 0.005);
  rotateY(0.2 + sin(frameCount * 0.003) * 0.15);
  if (picking === false) {
    drawRing(radius, 100, 0.5);
  }
  for (let i = 0; i < 5; i++) {
    drawBall(i, radius, picking);
  }
  pop();

  // 两条装饰轨道，只有圆环
  if (picking === false) {
    push();
    rotateX(-PI / 2 - 0.01);
    rotateZ(PI / 6 + sin(frameCount * 0.003) * 0.4);
    rotateY(0.3 - sin(frameCount * 0.002) * 0.2);
    drawRing(radius, 110, 1);
    pop();

    push();
    rotateX(PI / 2 + 0.01);
    rotateZ(PI / 12 + sin(frameCount * 0.003) * 0.5);
    rotateY(0.4 + sin(frameCount * 0.002) * 0.01);
    drawRing(radius, 110, 4);
    pop();
  }

  pop();
}

// 画一个圆环。opacity 是透明度，weight 是线的粗细。
function drawRing(radius, opacity, weight) {
  push();
  noFill();
  stroke(120, 215, 255, opacity);
  strokeWeight(weight);
  ellipse(0, 0, radius * 2, radius * 2, 48);
  pop();
}

// 第 i 颗光球。拾取时：涂编号颜色；还没选：画发光球；选过了：画选中的物品。
function drawBall(i, radius, picking) {
  let angle = -HALF_PI + TWO_PI * (i + 0.4) / 5;

  push();
  translate(cos(angle) * radius, sin(angle) * radius, 0);
  if (picking) {
    fill(tag(i + 1)); // tag() 把编号 1–5 变成一种特别的颜色
    sphere(40);
  } else if (chosen[i] === null) {
    if (hovered === i + 1) {
      emissiveMaterial(255, 120, 45); // 鼠标悬停：暖橙色
    } else {
      emissiveMaterial(120, 225, 255);
    }
    sphere(40);
  } else {
    chosen[i].draw(60);
  }
  pop();
}


// ===== 三选一画面 =====

// picking 为 true 时是给 colorPick 画的：每件物品位置上画一个编号方块
function drawChoices(picking) {
  let items = stages[activeStage].items;
  let size = min(width * 0.18, height * 0.32);

  for (let i = 0; i < 3; i++) {
    push();
    // 两种画法共用这一句，方块才会正好罩在物品上
    translate((i - 1) * width * 0.24, 0, 0); // i = 0, 1, 2 → 左、中、右

    if (picking) {
      fill(tag(i + 1)); // 先设颜色，再画
      box(size);
    } else {
      if (hovered === i + 1) {
        scale(1.15); // 鼠标悬停：稍微放大
      }
      items[i].draw(size);
    }

    pop();
  }
}
