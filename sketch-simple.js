// ===== 数据 =====

// 五个阶段，每个阶段三件物品。
// files：这件物品要加载的 OBJ 文件（大多数只有一个，手机和磁带机有好几个部件）。
// models：加载好的 3D 模型会放进这里，一开始是空的。
// 多部件物品还有 size / center / tilt，用来把几个部件摆成一个整体。、

class Item {
  constructor(name, file){
    this.name = name
    this.file = file
    this.model = []

  }

  //逐个加载模型并放在model中
  async load(){ 
    for (let f = 0; f < this.files.length; f++){
      let part = await loadModel(this.file[f], {fileType: ".obj", normalize: true})
      this.model.push(part)
    }
  }
  draw(size){
    push()
    scale(size/200)
    for(let m = 0; m<this.model.length; m++){
      nidek(this.model[m])
    rotateX(frameCount*0.01)
    rotateY(frameCount*0.005)
    }
    pop()
  }
  drawDetail(){
  }
  click(){
  }
}

//对于有多个结构成分的model，单独写一个子类class
class MultiPartItem extends Item{
  constructor(name, files, previewSize, center, tilt){
    super(name, files)
    this.previewSize = previewSizes
    this.center = center
    this.tilt = tilt
  }

  //覆盖父级的load
  async load(){
    for(let f = 0; f<this.files.length; f++){
      let part = await loadModel(this.files[f], {fileType:".obj", normalize: false})\
      this.model.push(part)
    }
  }

  //同样是覆盖父级的draw
  draw(){
    
  }
}
const stages = [
  {
    title: "Childhood",
    items: [
      { name: "Yo-yo", files: ["3d-assets/yoyo/yoyo.obj"], models: [] },
      { name: "Toy car", files: ["3d-assets/car/car.obj"], models: [] },
      { name: "Digital pet", files: ["3d-assets/pet/pet.obj"], models: [] }
    ]
  },
  {
    title: "School",
    items: [
      { name: "Notebook", files: ["3d-assets/blue-herbarium/blue-herbarium.obj"], models: [] },
      { name: "Pen", files: ["3d-assets/ripple-pen/ripple-pen.obj"], models: [] },
      { name: "Backpack", files: ["3d-assets/backpack/backpack.obj"], models: [] }
    ]
  },
  {
    title: "Portable electronics",
    items: [
      {
        name: "Flip phone",
        files: ["3d-assets/phone-lid/phone-base.obj", "3d-assets/phone-lid/phone-lid.obj"],
        models: [],
        size: 1.08217,
        center: [0, 0.15274, 0.00824],
        tilt: -Math.PI / 4
      },
      {
        name: "Cassette player",
        files: [
          "3d-assets/tideline-cassette-player/cassette.obj",
          "3d-assets/tideline-cassette-player/cassette-door.obj",
          "3d-assets/tideline-cassette-player/cassette-player.obj"
        ],
        models: [],
        size: 0.88321,
        center: [-0.21945, -0.05434, -0.21156],
        tilt: -Math.PI / 8
      },
      { name: "CD", files: ["3d-assets/cd/cd.obj"], models: [] }
    ]
  },
  {
    title: "Home electronics",
    items: [
      { name: "Computer", files: ["3d-assets/view-crt/view-crt.obj"], models: [] },
      { name: "TV", files: ["3d-assets/tv/tv.obj"], models: [] },
      { name: "Fridge", files: ["3d-assets/fridge/fridge.obj"], models: [] }
    ]
  },
  {
    title: "Medical equipment",
    items: [
      { name: "IV bag", files: ["3d-assets/aqua-care-iv/aqua-care-iv.obj"], models: [] },
      { name: "Stethoscope", files: ["3d-assets/stethoscope/stethoscope.obj"], models: [] },
      { name: "Thermometer", files: ["3d-assets/thermometer/thermometer.obj"], models: [] }
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

  // 加载 15 件物品
  for (let s = 0; s < stages.length; s++) {
    let items = stages[s].items;
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      // 只有一个文件的物品让 p5 自动缩放到统一大小；多部件物品保持原来的相对位置
      let onePart = item.files.length === 1;
      for (let f = 0; f < item.files.length; f++) {
        let part = await loadModel(item.files[f], { fileType: ".obj", normalize: onePart });
        item.models.push(part);
      }
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
  } else {
    updateHover(drawChoicePickLayer); //当显示选取视图，调用drawChoicePickLayer版本
    setLights();
    drawChoices(false);
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
  }
}


// ===== 切换画面 =====

function openStage(stageIndex) {
  view = "choose";
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
    drawItem(chosen[i], 60);
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
      drawItem(items[i], size);
    }

    pop();
  }
}


// ===== 画一件物品 =====

// 轨道上、三选一画面、详情画面都用这个函数。size 是想要的大小。
function drawItem(item, size) {
  push();

  if (item.files.length === 1) {
    // 单个模型已经被 normalize 成大约 200 宽
    scale(size / 200);
  } else {
    // 多部件：先缩放，再倾斜，再把整组的中心移到原点
    scale(size / item.size);
    rotateX(item.tilt);
    translate(-item.center[0], -item.center[1], -item.center[2]);
  }

  for (let m = 0; m < item.models.length; m++) {
    model(item.models[m]);
  }

  pop();
}
