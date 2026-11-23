// ===== 数据 =====

// 五个阶段，每个阶段三件物品。
// files：这件物品要加载的 OBJ 文件（大多数只有一个，手机和磁带机有好几个部件）。
// models：加载好的 3D 模型会放进这里，一开始是空的。
// 多部件物品还有 size / center / tilt，用来把几个部件摆成一个整体。
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

// 六个时钟模型。clocks[0] 是一件都没选时的时钟，clocks[5] 是全部选完。
let clocks = [];

// 玩家在每个阶段选中的物品。null 表示这个阶段还没选。
let chosen = [null, null, null, null, null];


// ===== p5 入口 =====

async function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

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

  console.log("all models loaded");
}

function draw() {
  background("blue");
  orbitControl();

  ambientLight(80, 100, 150);
  directionalLight(255, 255, 255, -0.35, 0.3, -1);
  directionalLight(85, 110, 150, 1, 0, -0.4);
  noStroke();

  drawClock();
  drawOrbit();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


// ===== 时钟 =====

// 数一数已经选了几件
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

function drawOrbit() {
  let radius = min(width, height) * 0.4;

  push();
  // 把原点移到时钟指针的转轴上，轨道就绕着指针转
  translate(0, -0.251411 * clockSize(), 0.030923 * clockSize());

  // 主轨道：一个圆环 + 五颗光球，用同一组旋转
  push();
  scale(1.3);
  rotateX(-PI / 2);
  rotateZ(-PI / 6 + frameCount * 0.005);
  rotateY(0.2 + sin(frameCount * 0.003) * 0.15);
  drawRing(radius, 100, 0.5);
  for (let i = 0; i < 5; i++) {
    drawBall(i, radius);
  }
  pop();

  // 两条装饰轨道，只有圆环
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

// 第 i 颗光球。还没选：画发光球；选过了：画选中的物品。
function drawBall(i, radius) {
  let angle = -HALF_PI + TWO_PI * (i + 0.4) / 5;

  push();
  translate(cos(angle) * radius, sin(angle) * radius, 0);
  if (chosen[i] === null) {
    emissiveMaterial(120, 225, 255);
    sphere(40);
  } else {
    drawItem(chosen[i], 60);
  }
  pop();
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
