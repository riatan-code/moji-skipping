const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("characterInput");
const throwButton = document.getElementById("throwButton");
const result = document.getElementById("result");

const waterY = 270;

let animationId = null;


// =========================
// 背景
// =========================

function drawBackground() {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // 空
  ctx.fillStyle = "#f8fbff";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  // 水
  ctx.fillStyle = "#d8eef8";

  ctx.fillRect(
    0,
    waterY,
    canvas.width,
    canvas.height - waterY
  );

  // 水面
  ctx.strokeStyle = "#5fa8d3";
  ctx.lineWidth = 3;

  ctx.beginPath();

  ctx.moveTo(
    0,
    waterY
  );

  ctx.lineTo(
    canvas.width,
    waterY
  );

  ctx.stroke();
}


// =========================
// 文字描画
// =========================

function drawCharacter(
  character,
  x,
  y,
  angle
) {

  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.rotate(
    angle
  );

  ctx.fillStyle = "#222";

  ctx.font =
    "70px sans-serif";

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.fillText(
    character,
    0,
    0
  );

  ctx.restore();
}


// =========================
// 文字解析
// =========================

function analyzeCharacter(
  character
) {

  const tempCanvas =
    document.createElement(
      "canvas"
    );

  tempCanvas.width = 220;
  tempCanvas.height = 220;

  const tempCtx =
    tempCanvas.getContext(
      "2d"
    );


  tempCtx.clearRect(
    0,
    0,
    220,
    220
  );


  tempCtx.fillStyle =
    "black";


  tempCtx.font =
    "170px sans-serif";


  tempCtx.textAlign =
    "center";


  tempCtx.textBaseline =
    "middle";


  tempCtx.fillText(
    character,
    110,
    110
  );


  const imageData =
    tempCtx.getImageData(
      0,
      0,
      220,
      220
    );


  const data =
    imageData.data;


  let minX = 220;
  let maxX = 0;

  let minY = 220;
  let maxY = 0;

  let pixels = 0;


  for (
    let y = 0;
    y < 220;
    y++
  ) {

    for (
      let x = 0;
      x < 220;
      x++
    ) {

      const index =
        (y * 220 + x) * 4;


      const alpha =
        data[index + 3];


      if (
        alpha > 40
      ) {

        pixels++;


        minX =
          Math.min(
            minX,
            x
          );


        maxX =
          Math.max(
            maxX,
            x
          );


        minY =
          Math.min(
            minY,
            y
          );


        maxY =
          Math.max(
            maxY,
            y
          );
      }
    }
  }


  const width =
    Math.max(
      1,
      maxX - minX
    );


  const height =
    Math.max(
      1,
      maxY - minY
    );


  // 横長さ
  const aspect =
    width / height;


  // 文字がどれくらい詰まっているか
  const density =
    pixels /
    (width * height);


  return {
    width,
    height,
    aspect,
    density
  };
}


// =========================
// 性能計算
// =========================

function calculateStats(
  character
) {

  const shape =
    analyzeCharacter(
      character
    );


  /*
    横長文字ほど強い。

    aspect
    一 → 大きい
    水 → 約1
    丨 → 小さい
  */


  const aspect =
    shape.aspect;


  // 水切り能力
  let skipPower =
    0.7 +
    aspect * 1.4;


  skipPower =
    Math.max(
      0.8,
      Math.min(
        skipPower,
        5.5
      )
    );


  /*
    密度が高すぎる文字は
    少し重い扱いにする
  */

  const weight =
    0.7 +
    shape.density * 1.6;


  // 水面で跳ねる強さ

  let bounce =
    1.4 +
    skipPower * 0.55 -
    weight * 0.20;


  bounce =
    Math.max(
      1.2,
      Math.min(
        bounce,
        4.2
      )
    );


  // 横方向速度

  let speed =
    5.3 +
    skipPower * 0.35;


  speed =
    Math.min(
      speed,
      7
    );


  // 速度維持性能

  let retention =
    0.76 +
    skipPower * 0.035;


  retention =
    Math.max(
      0.76,
      Math.min(
        retention,
        0.93
      )
    );


  return {

    aspect,

    density:
      shape.density,

    skipPower,

    bounce,

    speed,

    retention
  };
}


// =========================
// 初期画面
// =========================

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


// =========================
// 投げる
// =========================

function throwCharacter(
  character
) {

  if (
    animationId
  ) {

    cancelAnimationFrame(
      animationId
    );
  }


  const stats =
    calculateStats(
      character
    );


  let x =
    80;


  let y =
    190;


  let vx =
    stats.speed;


  let vy =
    -1.2;


  let angle =
    0;


  let rotationSpeed =
    0.12;


  let skips =
    0;


  const gravity =
    0.38;


  let currentBounce =
    stats.bounce;


  function animate() {

    drawBackground();


    x += vx;

    y += vy;


    vy +=
      gravity;


    angle +=
      rotationSpeed;


    // =====================
    // 水面への衝突
    // =====================

    if (
      y >= waterY - 27 &&
      vy > 0
    ) {

      skips++;


      /*
        跳ねるたびに
        少しずつ弱くなる
      */

      vy =
        -currentBounce;


      currentBounce *=
        0.91;


      vx *=
        stats.retention;


      rotationSpeed *=
        0.92;


      y =
        waterY - 28;
    }


    drawCharacter(
      character,
      x,
      y,
      angle
    );


    result.textContent =
      `水切り ${skips}回`;


    // =====================
    // 終了
    // =====================

    const tooSlow =
      vx < 1.4;


    const bounceTooWeak =
      currentBounce < 0.75;


    const outside =
      x > canvas.width + 50;


    if (
      tooSlow ||
      bounceTooWeak ||
      outside ||
      skips >= 30
    ) {

      result.innerHTML =
        `
        「${character}」
        水切り ${skips}回
        <br>
        横長度：
        ${stats.aspect.toFixed(2)}
        <br>
        水切り適性：
        ${stats.skipPower.toFixed(2)}
        `;


      animationId =
        null;


      return;
    }


    animationId =
      requestAnimationFrame(
        animate
      );
  }


  animate();
}


// =========================
// ボタン
// =========================

throwButton.addEventListener(
  "click",
  () => {

    const character =
      Array.from(
        input.value.trim()
      )[0];


    if (
      !character
    ) {

      result.textContent =
        "文字を入力してください";

      return;
    }


    throwCharacter(
      character
    );
  }
);


drawInitialScene(
  "水"
);
