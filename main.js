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
  ctx.moveTo(0, waterY);
  ctx.lineTo(canvas.width, waterY);
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

  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = "#222";
  ctx.font = "70px sans-serif";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    character,
    0,
    0
  );

  ctx.restore();
}


// =========================
// 水しぶき
// =========================

function drawSplash(x) {

  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  for (
    let i = 0;
    i < 5;
    i++
  ) {

    const offset =
      (i - 2) * 7;

    ctx.beginPath();

    ctx.moveTo(
      x,
      waterY
    );

    ctx.lineTo(
      x + offset,
      waterY - 12 - Math.abs(offset)
    );

    ctx.stroke();
  }
}


// =========================
// 文字解析
// =========================

function analyzeCharacter(
  character
) {

  const tempCanvas =
    document.createElement("canvas");

  tempCanvas.width = 220;
  tempCanvas.height = 220;

  const tempCtx =
    tempCanvas.getContext("2d");


  tempCtx.clearRect(
    0,
    0,
    220,
    220
  );


  tempCtx.fillStyle = "black";

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


  const aspect =
    width / height;


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
// 文字性能
// =========================

function calculateStats(
  character
) {

  const shape =
    analyzeCharacter(
      character
    );


  /*
    aspect をそのまま使うと
    「一」が極端に強くなりすぎるので
    対数で圧縮する。
  */

  const flatScore =
    Math.log2(
      shape.aspect + 1
    );


  /*
    水切り性能

    横長ほど高評価。
    密度が高すぎる文字は少し重くする。
  */

  let skipPower =
    1 +
    flatScore * 2.2 -
    shape.density * 0.8;


  skipPower =
    Math.max(
      0.5,
      Math.min(
        skipPower,
        8
      )
    );


  /*
    最終的に狙う水切り回数。

    ここがゲームバランスの中心。
  */

  let targetSkips =
    Math.round(
      2 +
      skipPower * 2
    );


  targetSkips =
    Math.max(
      1,
      Math.min(
        targetSkips,
        20
      )
    );


  /*
    強い文字ほど

    ・横速度が高い
    ・低く跳ねる
    ・速度を維持する

    ようにする。
  */

  const speed =
    7 +
    skipPower * 0.25;


  const bounce =
    Math.max(
      1.3,
      3.2 -
      skipPower * 0.18
    );


  const retention =
    Math.min(
      0.97,
      0.84 +
      skipPower * 0.015
    );


  return {

    aspect:
      shape.aspect,

    density:
      shape.density,

    skipPower,

    targetSkips,

    speed,

    bounce,

    retention
  };
}


// =========================
// 初期表示
// =========================

function drawInitialScene(
  character = "水"
) {

  drawBackground();

  drawCharacter(
    character,
    90,
    190,
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
    animationId !== null
  ) {

    cancelAnimationFrame(
      animationId
    );
  }


  const stats =
    calculateStats(
      character
    );


  let x = 70;

  let y =
    waterY - 65;


  let vx =
    stats.speed;


  let vy =
    0;


  let angle =
    -0.15;


  let rotationSpeed =
    0.05;


  let skips =
    0;


  let currentBounce =
    stats.bounce;


  const gravity =
    0.22;


  let splashX =
    null;


  let splashFrames =
    0;


  function animate() {

    drawBackground();


    // ---------------------
    // 移動
    // ---------------------

    x += vx;

    y += vy;

    vy += gravity;


    angle +=
      rotationSpeed;


    // ---------------------
    // 水面との接触
    // ---------------------

    if (
      y >= waterY - 18 &&
      vy > 0
    ) {

      skips++;


      splashX =
        x;

      splashFrames =
        5;


      /*
        目標回数に達したら沈む
      */

      if (
        skips >= stats.targetSkips
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


        drawCharacter(
          character,
          x,
          waterY + 18,
          angle
        );


        animationId =
          null;

        return;
      }


      /*
        低く細かく跳ねる
      */

      vy =
        -currentBounce;


      /*
        徐々に跳ね幅を小さくする
      */

      currentBounce *=
        0.96;


      /*
        横速度も少しずつ失う
      */

      vx *=
        stats.retention;


      rotationSpeed *=
        0.96;


      y =
        waterY - 19;
    }


    // ---------------------
    // 水しぶき
    // ---------------------

    if (
      splashFrames > 0
    ) {

      drawSplash(
        splashX
      );

      splashFrames--;
    }


    drawCharacter(
      character,
      x,
      y,
      angle
    );


    result.textContent =
      `水切り ${skips}回`;


    /*
      Canvas外まで行った場合は
      左に戻して続きを描画。

      ゲーム上の飛距離は継続している扱い。
    */

    if (
      x > canvas.width - 50
    ) {

      x = 70;
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

// =========================
// 自動テスト
// =========================

window.testCharacters = function (
  characters = [
    "一",
    "水",
    "Ⅰ",
    "鬱",
    "〇",
    "山",
    "川",
    "凹",
    "卍",
    "㍿"
  ]
) {

  const results =
    characters.map(
      character => {

        const stats =
          calculateStats(
            character
          );

        return {
          文字: character,

          横長度:
            Number(
              stats.aspect.toFixed(2)
            ),

          密度:
            Number(
              stats.density.toFixed(2)
            ),

          水切り適性:
            Number(
              stats.skipPower.toFixed(2)
            ),

          予測水切り回数:
            stats.targetSkips,

          初速:
            Number(
              stats.speed.toFixed(2)
            )
        };
      }
    );


  console.table(
    results
  );


  return results;
};
