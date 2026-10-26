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
// 水しぶき
// =========================

function drawSplash(x) {

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

  let sumY =
    0;


  // -----------------------
  // ピクセル取得
  // -----------------------

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
        (y * size + x) * 4;


      if (
        data[index + 3] > 40
      ) {

        mask[
          y * size + x
        ] = 1;


        pixels++;

        sumX +=
          x;

        sumY +=
          y;


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
    maxX - minX + 1;


  const height =
    maxY - minY + 1;


  // -----------------------
  // 横長度
  // -----------------------

  const aspect =
    width / height;


  // -----------------------
  // 密度
  // -----------------------

  const density =
    pixels /
    (
      width *
      height
    );


  // -----------------------
  // 重心
  // -----------------------

  const centerX =
    (
      sumX / pixels -
      minX
    ) /
    Math.max(
      1,
      width - 1
    );


  /*
    0.5に近いほど
    左右バランスが良い
  */

  const balance =
    1 -
    Math.min(
      1,
      Math.abs(
        centerX - 0.5
      ) * 2
    );


  // -----------------------
  // 左右対称性
  // -----------------------

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

      const leftX =
        minX + offset;


      const rightX =
        maxX - offset;


      const left =
        mask[
          y * size +
          leftX
        ];


      const right =
        mask[
          y * size +
          rightX
        ];


      // 両方空白なら比較しない
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
    comparisons > 0
      ? 1 -
        mismatches /
        comparisons
      : 1;


  // -----------------------
  // 接水幅
  // -----------------------

  /*
    文字の下30%を見る
  */

  const bottomStart =
    Math.floor(
      minY +
      height * 0.70
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
          y * size + x
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


  // -----------------------
  // 横長性能
  // -----------------------

  /*
    「一」のような極端な値を
    対数で圧縮する
  */

  let flatness =
    (
      Math.log2(
        shape.aspect
      ) + 2.5
    ) / 6;


  flatness =
    Math.max(
      0,
      Math.min(
        flatness,
        1
      )
    );


  // -----------------------
  // 総合水切り性能
  // -----------------------

  let score =

      flatness * 0.55

    + shape.symmetry * 0.15

    + shape.balance * 0.15

    + shape.contact * 0.15;


  /*
    極端に縦長の文字には
    大きなペナルティ
  */

  if (
    shape.aspect < 0.5
  ) {

    score *=
      0.45 +
      shape.aspect * 0.5;
  }


  score =
    Math.max(
      0,
      Math.min(
        score,
        1
      )
    );


  // -----------------------
  // 水切り回数
  // -----------------------

  const targetSkips =
    1 +
    Math.round(
      score * 16
    );


  // -----------------------
  // アニメーション性能
  // -----------------------

  const speed =
    7 +
    score * 2;


  const bounce =
    2.8 -
    score * 1.1;


  const retention =
    0.82 +
    score * 0.14;


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

    animationId =
      null;
  }


  const stats =
    calculateStats(
      character
    );


  let x =
    70;


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

    x +=
      vx;


    y +=
      vy;


    vy +=
      gravity;


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
        skips >=
        stats.targetSkips
      ) {

        result.innerHTML =
          `
          「${character}」
          水切り ${skips}回
          <br>
          横長度：
          ${stats.aspect.toFixed(2)}
          <br>
          左右対称：
          ${stats.symmetry.toFixed(2)}
          <br>
          重心：
          ${stats.balance.toFixed(2)}
          <br>
          接水幅：
          ${stats.contact.toFixed(2)}
          <br>
          総合適性：
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
        横速度を少しずつ失う
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
      左に戻して続きを描画
    */

    if (
      x > canvas.width - 50
    ) {

      x =
        70;
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
              stats.aspect.toFixed(2)
            ),

          左右対称:
            Number(
              stats.symmetry.toFixed(2)
            ),

          重心:
            Number(
              stats.balance.toFixed(2)
            ),

          接水幅:
            Number(
              stats.contact.toFixed(2)
            ),

          総合適性:
            Number(
              stats.skipPower.toFixed(2)
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
