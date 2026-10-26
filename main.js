const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("characterInput");
const throwButton = document.getElementById("throwButton");
const result = document.getElementById("result");

const waterY = 270;

let animationId = null;


// -------------------------
// 背景
// -------------------------

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f8fbff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#d8eef8";
  ctx.fillRect(
    0,
    waterY,
    canvas.width,
    canvas.height - waterY
  );

  ctx.strokeStyle = "#5fa8d3";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(0, waterY);
  ctx.lineTo(canvas.width, waterY);
  ctx.stroke();
}


// -------------------------
// 文字描画
// -------------------------

function drawCharacter(character, x, y, angle) {
  ctx.save();

  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = "#222";
  ctx.font = "70px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(character, 0, 0);

  ctx.restore();
}


// -------------------------
// 文字形状を解析
// -------------------------

function analyzeCharacter(character) {

  const tempCanvas =
    document.createElement("canvas");

  tempCanvas.width = 200;
  tempCanvas.height = 200;

  const tempCtx =
    tempCanvas.getContext("2d");

  tempCtx.clearRect(
    0,
    0,
    200,
    200
  );

  tempCtx.fillStyle = "black";

  tempCtx.font =
    "160px sans-serif";

  tempCtx.textAlign =
    "center";

  tempCtx.textBaseline =
    "middle";

  tempCtx.fillText(
    character,
    100,
    100
  );


  const imageData =
    tempCtx.getImageData(
      0,
      0,
      200,
      200
    );

  const data =
    imageData.data;


  let minX = 200;
  let maxX = 0;

  let minY = 200;
  let maxY = 0;

  let pixelCount = 0;


  for (
    let y = 0;
    y < 200;
    y++
  ) {

    for (
      let x = 0;
      x < 200;
      x++
    ) {

      const index =
        (y * 200 + x) * 4;

      const alpha =
        data[index + 3];


      if (alpha > 30) {

        pixelCount++;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;

        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }


  const width =
    maxX - minX;

  const height =
    maxY - minY;


  const widthRatio =
    width / 160;

  const heightRatio =
    height / 160;

  const areaRatio =
    pixelCount / (200 * 200);


  return {
    widthRatio,
    heightRatio,
    areaRatio
  };
}


// -------------------------
// 性能計算
// -------------------------

function calculateStats(character) {

  const shape =
    analyzeCharacter(character);


  // 横に広いほど水切り向き

  const flatness =
    shape.widthRatio /
    Math.max(
      shape.heightRatio,
      0.1
    );


  // 面積が大きいほど重い

  const weight =
    shape.areaRatio * 10;


  // 初速

  const speed =
    9 +
    flatness * 1.3;


  // 跳ねやすさ

  let bounce =
    3.5 +
    flatness * 1.2;


  bounce -=
    weight * 0.15;


  bounce =
    Math.max(
      2.5,
      Math.min(
        bounce,
        7
      )
    );


  // 横に広いほど速度維持

  let friction =
    0.80 +
    flatness * 0.025;


  friction =
    Math.max(
      0.80,
      Math.min(
        friction,
        0.94
      )
    );


  return {
    speed,
    bounce,
    friction,
    flatness,
    weight
  };
}


// -------------------------
// 初期表示
// -------------------------

function drawInitialScene(
  character = "水"
) {

  drawBackground();

  drawCharacter(
    character,
    100,
    180,
    0
  );
}


// -------------------------
// 投げる
// -------------------------

function throwCharacter(
  character
) {

  if (animationId) {
    cancelAnimationFrame(
      animationId
    );
  }


  const stats =
    calculateStats(
      character
    );


  let x = 100;
  let y = 180;


  let vx =
    stats.speed;


  let vy = -1.5;


  let angle = 0;

  let rotationSpeed =
    0.13;


  let skips = 0;


  const gravity =
    0.22;


  function animate() {

    drawBackground();


    x += vx;

    y += vy;


    vy += gravity;


    angle +=
      rotationSpeed;


    // 水面

    if (
      y >= waterY - 25 &&
      vy > 0
    ) {

      skips++;


      vy =
        -stats.bounce;


      vx *=
        stats.friction;


      rotationSpeed *=
        0.9;


      y =
        waterY - 26;
    }


    drawCharacter(
      character,
      x,
      y,
      angle
    );


    result.textContent =
      `水切り ${skips}回`;


    if (
      x > canvas.width + 50 ||
      vx < 1.5 ||
      skips >= 30
    ) {

      result.innerHTML =
        `
        「${character}」
        水切り ${skips}回
        <br>
        横長度 ${stats.flatness.toFixed(2)}
        `;

      animationId = null;

      return;
    }


    animationId =
      requestAnimationFrame(
        animate
      );
  }


  animate();
}


// -------------------------
// ボタン
// -------------------------

throwButton.addEventListener(
  "click",
  () => {

    const character =
      Array.from(
        input.value.trim()
      )[0];


    if (!character) {

      result.textContent =
        "文字を入力してください";

      return;
    }


    throwCharacter(
      character
    );
  }
);


drawInitialScene("水");
