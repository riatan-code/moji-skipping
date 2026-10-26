const canvas =
  document.getElementById("gameCanvas");

const ctx =
  canvas.getContext("2d");

const input =
  document.getElementById("characterInput");

const throwButton =
  document.getElementById("throwButton");

const angleInput =
  document.getElementById("angleInput");

const angleValue =
  document.getElementById("angleValue");

const distanceValue =
  document.getElementById("distanceValue");

const result =
  document.getElementById("result");

const shareButton =
  document.getElementById("shareButton");


const waterY = 280;

const START_X = 80;

const PIXELS_PER_METER = 18;

let animationId = null;

let lastResult = null;


// =========================
// 共通
// =========================

function clamp(
  value,
  min,
  max
) {

  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


// =========================
// 背景
// =========================

function drawBackground(
  cameraX = 0
) {

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  // 空

  ctx.fillStyle =
    "#f8fbff";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  // 水

  ctx.fillStyle =
    "#d8eef8";

  ctx.fillRect(
    0,
    waterY,
    canvas.width,
    canvas.height - waterY
  );


  // 水面

  ctx.strokeStyle =
    "#5fa8d3";

  ctx.lineWidth =
    3;

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


  // =====================
  // 距離目盛り
  // =====================

  ctx.font =
    "13px sans-serif";

  ctx.fillStyle =
    "#50809a";

  ctx.strokeStyle =
    "#8ec4dd";

  ctx.lineWidth =
    1;


  const firstMeter =
    Math.floor(
      cameraX /
      PIXELS_PER_METER /
      10
    ) * 10;


  for (
    let meters = firstMeter;
    meters < firstMeter + 100;
    meters += 10
  ) {

    const worldX =
      meters *
      PIXELS_PER_METER;


    const screenX =
      START_X +
      worldX -
      cameraX;


    if (
      screenX < 0 ||
      screenX > canvas.width
    ) {

      continue;
    }


    ctx.beginPath();

    ctx.moveTo(
      screenX,
      waterY
    );

    ctx.lineTo(
      screenX,
      waterY + 12
    );

    ctx.stroke();


    ctx.fillText(
      `${meters}m`,
      screenX + 4,
      waterY + 28
    );
  }
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


  ctx.fillStyle =
    "#222";


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
// 水しぶき
// =========================

function drawSplash(
  x
) {

  ctx.strokeStyle =
    "#ffffff";

  ctx.lineWidth =
    2;


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
      waterY -
      10 -
      Math.abs(
        offset
      )
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

  const size =
    240;


  const tempCanvas =
    document.createElement(
      "canvas"
    );


  tempCanvas.width =
    size;

  tempCanvas.height =
    size;


  const tempCtx =
    tempCanvas.getContext(
      "2d"
    );


  tempCtx.clearRect(
    0,
    0,
    size,
    size
  );


  tempCtx.fillStyle =
    "black";


  tempCtx.font =
    "180px sans-serif";


  tempCtx.textAlign =
    "center";


  tempCtx.textBaseline =
    "middle";


  tempCtx.fillText(
    character,
    size / 2,
    size / 2
  );


  const imageData =
    tempCtx.getImageData(
      0,
      0,
      size,
      size
    );


  const data =
    imageData.data;


  const mask =
    new Uint8Array(
      size * size
    );


  let minX =
    size;

  let maxX =
    -1;

  let minY =
    size;

  let maxY =
    -1;


  let pixels =
    0;

  let sumX =
    0;


  for (
    let y = 0;
    y < size;
    y++
  ) {

    for (
      let x = 0;
      x < size;
      x++
    ) {

      const index =
        (
          y * size +
          x
        ) * 4;


      if (
        data[
          index + 3
        ] > 40
      ) {

        mask[
          y * size +
          x
        ] = 1;


        pixels++;

        sumX +=
          x;


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


  if (
    pixels === 0
  ) {

    return {

      aspect: 1,

      density: 0,

      symmetry: 0,

      balance: 0,

      contact: 0
    };
  }


  const width =
    maxX -
    minX +
    1;


  const height =
    maxY -
    minY +
    1;


  const aspect =
    width /
    height;


  const density =
    pixels /
    (
      width *
      height
    );


  // =====================
  // 重心
  // =====================

  const centerX =
    (
      sumX /
      pixels -
      minX
    ) /
    Math.max(
      1,
      width - 1
    );


  const balance =
    1 -
    Math.min(
      1,
      Math.abs(
        centerX -
        0.5
      ) * 2
    );


  // =====================
  // 左右対称性
  // =====================

  let comparisons =
    0;

  let mismatches =
    0;


  for (
    let y = minY;
    y <= maxY;
    y++
  ) {

    for (
      let offset = 0;
      offset <
      Math.floor(
        width / 2
      );
      offset++
    ) {

      const left =
        mask[
          y * size +
          minX +
          offset
        ];


      const right =
        mask[
          y * size +
          maxX -
          offset
        ];


      if (
        left ||
        right
      ) {

        comparisons++;


        if (
          left !== right
        ) {

          mismatches++;
        }
      }
    }
  }


  const symmetry =
    comparisons
      ? 1 -
        mismatches /
        comparisons
      : 1;


  // =====================
  // 接水幅
  // =====================

  const bottomStart =
    Math.floor(
      minY +
      height *
      0.70
    );


  let contactColumns =
    0;


  for (
    let x = minX;
    x <= maxX;
    x++
  ) {

    let touching =
      false;


    for (
      let y = bottomStart;
      y <= maxY;
      y++
    ) {

      if (
        mask[
          y * size +
          x
        ]
      ) {

        touching =
          true;

        break;
      }
    }


    if (
      touching
    ) {

      contactColumns++;
    }
  }


  const contact =
    contactColumns /
    width;


  return {

    aspect,

    density,

    symmetry,

    balance,

    contact
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


  let flatness =
    (
      Math.log2(
        shape.aspect
      ) +
      2.5
    ) /
    6;


  flatness =
    clamp(
      flatness,
      0,
      1
    );


  let score =

      flatness *
      0.55

    + shape.symmetry *
      0.15

    + shape.balance *
      0.15

    + shape.contact *
      0.15;


  if (
    shape.aspect <
    0.5
  ) {

    score *=
      0.45 +
      shape.aspect *
      0.5;
  }


  score =
    clamp(
      score,
      0,
      1
    );


  const targetSkips =
    1 +
    Math.round(
      score *
      16
    );


  const speed =
    8 +
    score *
    2.4;


  const bounce =
    2.7 -
    score *
    1.0;


  const retention =
    0.83 +
    score *
    0.14;


  return {

    aspect:
      shape.aspect,

    density:
      shape.density,

    symmetry:
      shape.symmetry,

    balance:
      shape.balance,

    contact:
      shape.contact,

    skipPower:
      score,

    targetSkips,

    speed,

    bounce,

    retention
  };
}


// =========================
// 投げる角度の性能
// =========================

function calculateAngleFactor(
  angleDegrees
) {

  /*
    8度付近を理想角度とする。

    角度が悪くても
    完全に0にはしない。
  */

  const idealAngle =
    8;


  const difference =
    Math.abs(
      angleDegrees -
      idealAngle
    );


  return clamp(
    1 -
    difference /
    22,
    0.35,
    1
  );
}


// =========================
// 初期画面
// =========================

function drawInitialScene(
  character = "水"
) {

  drawBackground(
    0
  );


  drawCharacter(
    character,
    START_X,
    waterY - 55,
    0
  );
}


// =========================
// ゲーム終了
// =========================

function finishThrow(
  character,
  skips,
  distance,
  angle,
  stats
) {

  const finalDistance =
    Number(
      distance.toFixed(
        1
      )
    );


  distanceValue.textContent =
    `${finalDistance.toFixed(1)} m`;


  result.innerHTML =
    `
    <strong>「${character}」</strong>
    <br>
    水切り ${skips}回
    <br>
    飛距離 ${finalDistance.toFixed(1)}m
    <br>
    投射角 ${angle}°
    `;


  lastResult = {

    character,

    skips,

    distance:
      finalDistance,

    angle,

    score:
      stats.skipPower
  };


  shareButton.hidden =
    false;


  animationId =
    null;
}


// =========================
// 投げる
// =========================

function throwCharacter(
  character,
  launchAngle
) {

  if (
    animationId !== null
  ) {

    cancelAnimationFrame(
      animationId
    );
  }


  shareButton.hidden =
    true;


  const stats =
    calculateStats(
      character
    );


  const angleFactor =
    calculateAngleFactor(
      launchAngle
    );


  /*
    文字性能 × 投げる角度
  */

  const effectiveSkips =
    Math.max(
      1,
      Math.round(
        stats.targetSkips *
        angleFactor
      )
    );


  const radians =
    launchAngle *
    Math.PI /
    180;


  let worldX =
    0;


  let y =
    waterY -
    55;


  let vx =
    stats.speed *
    Math.cos(
      radians
    );


  let vy =
    -stats.speed *
    Math.sin(
      radians
    );


  let angle =
    -radians;


  let rotationSpeed =
    0.04;


  let skips =
    0;


  let currentBounce =
    stats.bounce;


  const gravity =
    0.22;


  let splashWorldX =
    null;


  let splashFrames =
    0;


  function animate() {

    worldX +=
      vx;


    y +=
      vy;


    vy +=
      gravity;


    angle +=
      rotationSpeed;


    /*
      カメラを追従させる
    */

    const cameraX =
      Math.max(
        0,
        worldX -
        650
      );


    const screenX =
      START_X +
      worldX -
      cameraX;


    drawBackground(
      cameraX
    );


    // =====================
    // 水面接触
    // =====================

    if (
      y >=
      waterY - 18 &&
      vy > 0
    ) {

      skips++;


      splashWorldX =
        worldX;


      splashFrames =
        5;


      /*
        指定回数に達したら沈む
      */

      if (
        skips >=
        effectiveSkips
      ) {

        const distance =
          worldX /
          PIXELS_PER_METER;


        drawCharacter(
          character,
          screenX,
          waterY + 12,
          angle
        );


        finishThrow(
          character,
          skips,
          distance,
          launchAngle,
          stats
        );


        return;
      }


      vy =
        -currentBounce;


      currentBounce *=
        0.96;


      vx *=
        stats.retention;


      rotationSpeed *=
        0.96;


      y =
        waterY -
        19;
    }


    // =====================
    // 水しぶき
    // =====================

    if (
      splashFrames >
      0
    ) {

      const splashScreenX =
        START_X +
        splashWorldX -
        cameraX;


      drawSplash(
        splashScreenX
      );


      splashFrames--;
    }


    drawCharacter(
      character,
      screenX,
      y,
      angle
    );


    const distance =
      worldX /
      PIXELS_PER_METER;


    distanceValue.textContent =
      `${distance.toFixed(1)} m`;


    result.textContent =
      `水切り ${skips}回`;


    /*
      安全用終了条件
    */

    if (
      distance >
      300 ||
      vx <
      0.5
    ) {

      finishThrow(
        character,
        skips,
        distance,
        launchAngle,
        stats
      );


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
// 角度スライダー
// =========================

angleInput.addEventListener(
  "input",
  () => {

    angleValue.textContent =
      `${angleInput.value}°`;
  }
);


// =========================
// 投げるボタン
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


    const angle =
      Number(
        angleInput.value
      );


    distanceValue.textContent =
      "0.0 m";


    throwCharacter(
      character,
      angle
    );
  }
);


// =========================
// X共有
// =========================

shareButton.addEventListener(
  "click",
  () => {

    if (
      !lastResult
    ) {

      return;
    }


    const text =
      `文字水切りで「${lastResult.character}」を投げました！

🌊 水切り：${lastResult.skips}回
📏 飛距離：${lastResult.distance.toFixed(1)}m
🎯 投射角：${lastResult.angle}°

あなたも最強の文字を探してみよう。

#文字水切り

${window.location.href}`;


    const shareUrl =
      "https://x.com/intent/post?text=" +
      encodeURIComponent(
        text
      );


    window.open(
      shareUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }
);


// =========================
// 自動テスト
// =========================

window.testCharacters =
function (
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

          文字:
            character,

          横長度:
            Number(
              stats.aspect.toFixed(
                2
              )
            ),

          左右対称:
            Number(
              stats.symmetry.toFixed(
                2
              )
            ),

          重心:
            Number(
              stats.balance.toFixed(
                2
              )
            ),

          接水幅:
            Number(
              stats.contact.toFixed(
                2
              )
            ),

          総合適性:
            Number(
              stats.skipPower.toFixed(
                2
              )
            ),

          予測回数:
            stats.targetSkips
        };
      }
    );


  console.table(
    results
  );


  return results;
};


// =========================
// 初期化
// =========================

drawInitialScene(
  "水"
);
