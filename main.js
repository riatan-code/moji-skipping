const canvas =
  document.getElementById("gameCanvas");

const ctx =
  canvas.getContext("2d");

const input =
  document.getElementById("characterInput");

const result =
  document.getElementById("result");

const shareButton =
  document.getElementById("shareButton");

const distanceValue =
  document.getElementById("distanceValue");

const skipsValue =
  document.getElementById("skipsValue");

const angleValue =
  document.getElementById("angleValue");

const powerValue =
  document.getElementById("powerValue");

const canvasHint =
  document.getElementById("canvasHint");


const WATER_Y = 355;

const START_X = 110;

const START_Y =
  WATER_Y - 55;

const PIXELS_PER_METER = 17;


let animationId = null;

let gameState = "ready";

let aiming = false;

let pointerId = null;

let aimPointer = null;

let aimAngle = 8;

let aimPower = 0.75;

let dragDistance = 0;

let lastResult = null;

let particles = [];


// =========================
// UTIL
// =========================

function clamp(
  value,
  min,
  max
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}


function getCharacter() {

  return (
    Array.from(
      input.value.trim()
    )[0] || "水"
  );
}


function getPointerPosition(
  event
) {

  const rect =
    canvas.getBoundingClientRect();

  return {
    x:
      (
        event.clientX -
        rect.left
      ) *
      canvas.width /
      rect.width,

    y:
      (
        event.clientY -
        rect.top
      ) *
      canvas.height /
      rect.height
  };
}


// =========================
// RESET
// =========================

function resetGame() {

  if (
    animationId !== null
  ) {
    cancelAnimationFrame(
      animationId
    );

    animationId = null;
  }

  gameState = "ready";

  aiming = false;
  pointerId = null;
  aimPointer = null;
  dragDistance = 0;

  particles = [];
  lastResult = null;

  distanceValue.textContent =
    "0.0m";

  skipsValue.textContent =
    "0";

  angleValue.textContent =
    `${aimAngle.toFixed(1)}°`;

  powerValue.textContent =
    `${Math.round(
      aimPower * 100
    )}%`;

  result.textContent =
    "文字を引っぱって投げてください";

  shareButton.hidden = true;

  canvasHint.textContent =
    "文字をつかんで引っぱる";

  canvasHint.classList.remove(
    "hidden"
  );

  drawAim();
}


// =========================
// BACKGROUND
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


  const sky =
    ctx.createLinearGradient(
      0,
      0,
      0,
      WATER_Y
    );

  sky.addColorStop(
    0,
    "#eefaff"
  );

  sky.addColorStop(
    0.62,
    "#dff4fc"
  );

  sky.addColorStop(
    1,
    "#cbeaf5"
  );

  ctx.fillStyle = sky;

  ctx.fillRect(
    0,
    0,
    canvas.width,
    WATER_Y
  );


  const sun =
    ctx.createRadialGradient(
      735,
      78,
      2,
      735,
      78,
      105
    );

  sun.addColorStop(
    0,
    "rgba(255,255,255,0.88)"
  );

  sun.addColorStop(
    1,
    "rgba(255,255,255,0)"
  );

  ctx.fillStyle = sun;

  ctx.fillRect(
    610,
    0,
    250,
    195
  );


  ctx.fillStyle =
    "rgba(100,150,165,0.14)";

  ctx.beginPath();

  ctx.moveTo(
    0,
    WATER_Y
  );

  ctx.lineTo(
    0,
    WATER_Y - 26
  );

  ctx.quadraticCurveTo(
    180,
    WATER_Y - 78,
    365,
    WATER_Y - 30
  );

  ctx.quadraticCurveTo(
    565,
    WATER_Y - 70,
    730,
    WATER_Y - 24
  );

  ctx.quadraticCurveTo(
    815,
    WATER_Y - 45,
    canvas.width,
    WATER_Y - 18
  );

  ctx.lineTo(
    canvas.width,
    WATER_Y
  );

  ctx.closePath();

  ctx.fill();


  const water =
    ctx.createLinearGradient(
      0,
      WATER_Y,
      0,
      canvas.height
    );

  water.addColorStop(
    0,
    "#8cd0e8"
  );

  water.addColorStop(
    1,
    "#347f9f"
  );

  ctx.fillStyle = water;

  ctx.fillRect(
    0,
    WATER_Y,
    canvas.width,
    canvas.height -
    WATER_Y
  );


  ctx.strokeStyle =
    "rgba(255,255,255,0.8)";

  ctx.lineWidth = 2;

  ctx.beginPath();

  ctx.moveTo(
    0,
    WATER_Y
  );

  ctx.lineTo(
    canvas.width,
    WATER_Y
  );

  ctx.stroke();


  ctx.strokeStyle =
    "rgba(255,255,255,0.19)";

  ctx.lineWidth = 1;

  for (
    let row = 0;
    row < 4;
    row++
  ) {

    const y =
      WATER_Y +
      25 +
      row * 30;

    ctx.beginPath();

    for (
      let x = 0;
      x <= canvas.width;
      x += 24
    ) {

      const waveY =
        y +
        Math.sin(
          (
            x +
            cameraX *
            0.15
          ) *
          0.03
        ) *
        2;

      if (
        x === 0
      ) {
        ctx.moveTo(
          x,
          waveY
        );
      } else {
        ctx.lineTo(
          x,
          waveY
        );
      }
    }

    ctx.stroke();
  }


  ctx.font =
    '12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  ctx.fillStyle =
    "rgba(255,255,255,0.78)";


  const startMeters =
    Math.floor(
      cameraX /
      PIXELS_PER_METER /
      10
    ) * 10;


  for (
    let meters = startMeters;
    meters < startMeters + 100;
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

    ctx.fillRect(
      screenX,
      WATER_Y,
      1,
      10
    );

    ctx.fillText(
      `${meters}m`,
      screenX + 5,
      WATER_Y + 25
    );
  }
}


// =========================
// CHARACTER
// =========================

function drawCharacter(
  character,
  x,
  y,
  rotation = 0,
  alpha = 1,
  color = "#0f172a"
) {

  ctx.save();

  ctx.translate(
    x,
    y
  );

  ctx.rotate(
    rotation
  );

  ctx.globalAlpha =
    alpha;

  ctx.fillStyle =
    color;

  ctx.font =
    '700 72px "Noto Sans JP", sans-serif';

  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";

  ctx.shadowColor =
    "rgba(15,23,42,0.16)";

  ctx.shadowBlur =
    8;

  ctx.shadowOffsetY =
    5;

  ctx.fillText(
    character,
    0,
    0
  );

  ctx.restore();
}


// =========================
// SPLASH
// =========================

function spawnSplash(
  worldX,
  intensity = 1
) {

  const count =
    Math.round(
      18 +
      intensity *
      15
    );

  for (
    let i = 0;
    i < count;
    i++
  ) {

    const life =
      26 +
      Math.random() *
      18;

    particles.push({
      worldX,

      y:
        WATER_Y,

      vx:
        (
          Math.random() -
          0.5
        ) *
        4.5 *
        intensity,

      vy:
        -(
          1.4 +
          Math.random() *
          4.8 *
          intensity
        ),

      size:
        1.5 +
        Math.random() *
        3.3,

      life,

      maxLife:
        life
    });
  }
}


function updateAndDrawParticles(
  cameraX
) {

  const next = [];

  for (
    const particle
    of particles
  ) {

    particle.worldX +=
      particle.vx;

    particle.y +=
      particle.vy;

    particle.vy +=
      0.17;

    particle.life--;

    if (
      particle.life <= 0
    ) {
      continue;
    }

    const screenX =
      START_X +
      particle.worldX -
      cameraX;

    const alpha =
      particle.life /
      particle.maxLife;

    ctx.fillStyle =
      `rgba(255,255,255,${
        alpha * 0.92
      })`;

    ctx.beginPath();

    ctx.arc(
      screenX,
      particle.y,
      particle.size,
      0,
      Math.PI * 2
    );

    ctx.fill();

    next.push(
      particle
    );
  }

  particles = next;
}


// =========================
// CHARACTER ANALYSIS
// =========================

function analyzeCharacter(
  character
) {

  const size = 240;

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

  let minX = size;
  let maxX = -1;

  let minY = size;
  let maxY = -1;

  let pixels = 0;
  let sumX = 0;


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

        sumX += x;

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
      ) *
      2
    );


  let comparisons = 0;
  let mismatches = 0;

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


  const bottomStart =
    Math.floor(
      minY +
      height *
      0.7
    );

  let contactColumns = 0;

  for (
    let x = minX;
    x <= maxX;
    x++
  ) {

    let touching =
      false;

    for (
      let y =
        bottomStart;

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


  return {
    aspect,
    density,
    symmetry,
    balance,

    contact:
      contactColumns /
      width
  };
}


// =========================
// STATS
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


  return {
    ...shape,

    score,

    targetSkips:
      1 +
      Math.round(
        score *
        16
      ),

    speed:
      8 +
      score *
      2.5,

    bounce:
      2.8 -
      score *
      1.05,

    retention:
      0.83 +
      score *
      0.14
  };
}


// =========================
// ANGLE
// =========================

function calculateAngleFactor(
  angle
) {

  const difference =
    Math.abs(
      angle -
      8
    );

  return clamp(
    1 -
    difference /
    22,
    0.3,
    1
  );
}


// =========================
// AIM
// =========================

function drawAim() {

  const character =
    getCharacter();

  drawBackground(0);

  drawCharacter(
    character,
    START_X,
    START_Y,
    0
  );


  if (
    aiming &&
    aimPointer
  ) {

    ctx.strokeStyle =
      "rgba(15,23,42,0.25)";

    ctx.lineWidth = 3;

    ctx.setLineDash(
      [7, 7]
    );

    ctx.beginPath();

    ctx.moveTo(
      START_X,
      START_Y
    );

    ctx.lineTo(
      aimPointer.x,
      aimPointer.y
    );

    ctx.stroke();

    ctx.setLineDash([]);
  }


  const radians =
    aimAngle *
    Math.PI /
    180;

  const length =
    85 +
    aimPower *
    105;

  const endX =
    START_X +
    Math.cos(
      radians
    ) *
    length;

  const endY =
    START_Y -
    Math.sin(
      radians
    ) *
    length;


  const gradient =
    ctx.createLinearGradient(
      START_X,
      START_Y,
      endX,
      endY
    );

  gradient.addColorStop(
    0,
    "rgba(14,165,233,0.25)"
  );

  gradient.addColorStop(
    1,
    "rgba(2,132,199,1)"
  );

  ctx.strokeStyle =
    gradient;

  ctx.lineWidth = 6;
  ctx.lineCap =
    "round";

  ctx.beginPath();

  ctx.moveTo(
    START_X + 30,
    START_Y
  );

  ctx.lineTo(
    endX,
    endY
  );

  ctx.stroke();


  const arrow = 13;

  ctx.fillStyle =
    "#0284c7";

  ctx.beginPath();

  ctx.moveTo(
    endX,
    endY
  );

  ctx.lineTo(
    endX -
    Math.cos(
      radians -
      0.5
    ) *
    arrow,

    endY +
    Math.sin(
      radians -
      0.5
    ) *
    arrow
  );

  ctx.lineTo(
    endX -
    Math.cos(
      radians +
      0.5
    ) *
    arrow,

    endY +
    Math.sin(
      radians +
      0.5
    ) *
    arrow
  );

  ctx.closePath();

  ctx.fill();
}


function updateAim(
  pos
) {

  const dragX =
    pos.x -
    START_X;

  const dragY =
    pos.y -
    START_Y;

  dragDistance =
    Math.hypot(
      dragX,
      dragY
    );


  const launchX =
    -dragX;

  const launchY =
    -dragY;


  if (
    launchX > 1
  ) {

    const rawAngle =
      Math.atan2(
        -launchY,
        launchX
      ) *
      180 /
      Math.PI;

    aimAngle =
      clamp(
        rawAngle,
        -5,
        25
      );
  }


  aimPower =
    clamp(
      dragDistance /
      165,
      0.25,
      1
    );


  angleValue.textContent =
    `${aimAngle.toFixed(1)}°`;

  powerValue.textContent =
    `${Math.round(
      aimPower *
      100
    )}%`;

  drawAim();
}


// =========================
// POINTER
// =========================

canvas.addEventListener(
  "pointerdown",
  event => {

    if (
      gameState ===
      "result"
    ) {
      resetGame();
      return;
    }


    if (
      gameState !==
      "ready" ||
      animationId !==
      null
    ) {
      return;
    }


    const pos =
      getPointerPosition(
        event
      );

    const distance =
      Math.hypot(
        pos.x -
        START_X,

        pos.y -
        START_Y
      );


    const grabRadius =
      window.matchMedia(
        "(pointer: coarse)"
      ).matches
        ? 165
        : 105;


    if (
      distance >
      grabRadius
    ) {
      return;
    }


    aiming = true;

    pointerId =
      event.pointerId;

    canvas.setPointerCapture(
      pointerId
    );

    aimPointer = pos;

    canvasHint.classList.add(
      "hidden"
    );

    updateAim(pos);
  }
);


canvas.addEventListener(
  "pointermove",
  event => {

    if (
      !aiming ||
      event.pointerId !==
      pointerId
    ) {
      return;
    }

    const pos =
      getPointerPosition(
        event
      );

    aimPointer = pos;

    updateAim(pos);
  }
);


canvas.addEventListener(
  "pointerup",
  releaseAim
);


canvas.addEventListener(
  "pointercancel",
  releaseAim
);


function releaseAim(
  event
) {

  if (
    !aiming ||
    event.pointerId !==
    pointerId
  ) {
    return;
  }


  aiming = false;

  try {
    canvas.releasePointerCapture(
      pointerId
    );
  } catch {}


  pointerId = null;


  if (
    dragDistance <
    28
  ) {

    drawAim();

    result.textContent =
      "もう少し大きく引っぱってください";

    return;
  }


  throwCharacter(
    getCharacter(),
    aimAngle,
    aimPower
  );
}


// =========================
// THROW
// =========================

function throwCharacter(
  character,
  launchAngle,
  launchPower
) {

  particles = [];

  gameState =
    "flying";

  shareButton.hidden =
    true;

  canvasHint.classList.add(
    "hidden"
  );


  const stats =
    calculateStats(
      character
    );

  const angleFactor =
    calculateAngleFactor(
      launchAngle
    );

  const powerFactor =
    0.68 +
    launchPower *
    0.45;


  const effectiveSkips =
    Math.max(
      1,

      Math.round(
        stats.targetSkips *
        angleFactor *
        (
          0.76 +
          launchPower *
          0.24
        )
      )
    );


  const radians =
    launchAngle *
    Math.PI /
    180;


  let worldX = 0;

  let y =
    START_Y;


  let vx =
    stats.speed *
    powerFactor *
    Math.cos(
      radians
    );


  let vy =
    -stats.speed *
    powerFactor *
    Math.sin(
      radians
    );


  let rotation =
    -radians;


  let spin =
    0.035 +
    (
      1 -
      stats.symmetry
    ) *
    0.05;


  let skips = 0;

  let currentBounce =
    stats.bounce;

  const gravity = 0.22;


  function animate() {

    worldX += vx;

    y += vy;

    vy += gravity;

    rotation += spin;


    const cameraX =
      Math.max(
        0,
        worldX -
        560
      );


    let screenX =
      START_X +
      worldX -
      cameraX;


    drawBackground(
      cameraX
    );


    if (
      y >=
      WATER_Y -
      18 &&
      vy > 0
    ) {

      skips++;

      skipsValue.textContent =
        skips;


      spawnSplash(
        worldX,

        clamp(
          Math.abs(vy) /
          3,
          0.75,
          1.55
        )
      );


      if (
        skips >=
        effectiveSkips
      ) {

        const distance =
          worldX /
          PIXELS_PER_METER;


        spawnSplash(
          worldX,
          1.6
        );


        startSinking(
          character,
          rotation,
          worldX,
          cameraX,
          skips,
          distance,
          launchAngle,
          launchPower
        );

        return;
      }


      vy =
        -currentBounce;

      currentBounce *=
        0.955;

      vx *=
        stats.retention;

      spin *=
        0.97;

      y =
        WATER_Y -
        19;
    }


    updateAndDrawParticles(
      cameraX
    );


    screenX =
      START_X +
      worldX -
      cameraX;


    drawCharacter(
      character,
      screenX,
      y,
      rotation
    );


    const distance =
      worldX /
      PIXELS_PER_METER;


    distanceValue.textContent =
      `${distance.toFixed(1)}m`;

    result.textContent =
      `水切り ${skips}回`;


    if (
      distance > 350 ||
      vx < 0.45 ||
      y >
      canvas.height +
      60
    ) {

      startSinking(
        character,
        rotation,
        worldX,
        cameraX,
        skips,
        distance,
        launchAngle,
        launchPower
      );

      return;
    }


    animationId =
      requestAnimationFrame(
        animate
      );
  }


  animationId =
    requestAnimationFrame(
      animate
    );
}


// =========================
// SINK
// =========================

function startSinking(
  character,
  rotation,
  worldX,
  cameraX,
  skips,
  distance,
  angle,
  power
) {

  gameState =
    "sinking";


  let sinkY =
    WATER_Y + 3;

  let sinkVelocity =
    0.65;

  let sinkRotation =
    rotation;

  let frames = 0;


  function sinkFrame() {

    drawBackground(
      cameraX
    );

    updateAndDrawParticles(
      cameraX
    );


    sinkY +=
      sinkVelocity;

    sinkVelocity +=
      0.045;

    sinkRotation +=
      0.008;

    frames++;


    const screenX =
      START_X +
      worldX -
      cameraX;


    const alpha =
      clamp(
        0.82 -
        (
          sinkY -
          WATER_Y
        ) /
        130,

        0.35,
        0.82
      );


    drawCharacter(
      character,
      screenX,
      sinkY,
      sinkRotation,
      alpha,
      "#0b4f6c"
    );


    ctx.fillStyle =
      "rgba(42,132,169,0.09)";

    ctx.fillRect(
      0,
      WATER_Y,
      canvas.width,
      canvas.height -
      WATER_Y
    );


    if (
      sinkY <
      WATER_Y + 68 &&
      frames < 60
    ) {

      animationId =
        requestAnimationFrame(
          sinkFrame
        );

      return;
    }


    // 最終画面を描画。
    // 以後は描き直さない。

    drawBackground(
      cameraX
    );

    updateAndDrawParticles(
      cameraX
    );


    drawCharacter(
      character,
      screenX,
      WATER_Y + 68,
      sinkRotation,
      0.36,
      "#0b4f6c"
    );


    ctx.fillStyle =
      "rgba(42,132,169,0.11)";

    ctx.fillRect(
      0,
      WATER_Y,
      canvas.width,
      canvas.height -
      WATER_Y
    );


    finishThrow(
      character,
      skips,
      distance,
      angle,
      power
    );
  }


  animationId =
    requestAnimationFrame(
      sinkFrame
    );
}


// =========================
// RESULT
// =========================

function finishThrow(
  character,
  skips,
  distance,
  angle,
  power
) {

  animationId = null;

  gameState =
    "result";


  const finalDistance =
    Number(
      distance.toFixed(1)
    );


  distanceValue.textContent =
    `${finalDistance.toFixed(1)}m`;


  skipsValue.textContent =
    skips;


  result.innerHTML =
    `
      <strong>
        「${character}」
        ${finalDistance.toFixed(1)}m
      </strong>

      <br>

      水切り ${skips}回
      ・
      投射角 ${angle.toFixed(1)}°
      ・
      POWER ${Math.round(
        power * 100
      )}%
    `;


  lastResult = {
    character,
    skips,
    distance:
      finalDistance,

    angle:
      Number(
        angle.toFixed(1)
      ),

    power:
      Math.round(
        power * 100
      )
  };


  shareButton.hidden =
    false;


  canvasHint.textContent =
    "画面をタップしてもう一度";


  canvasHint.classList.remove(
    "hidden"
  );


  /*
    ここで drawAim() は呼ばない。

    したがって、
    沈んだ最終フレームが
    そのまま残る。
  */
}


// =========================
// SHARE
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
`文字水切りで「${lastResult.character}」を投げました。

🌊 水切り ${lastResult.skips}回
📏 ${lastResult.distance.toFixed(1)}m
🎯 ${lastResult.angle}°
⚡ POWER ${lastResult.power}%

最強の文字を探せ。

#文字水切り

${window.location.href}`;


    const url =
      "https://x.com/intent/post?text=" +
      encodeURIComponent(text);


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }
);


// =========================
// CHARACTER INPUT
// =========================

input.addEventListener(
  "input",
  () => {

    if (
      gameState ===
      "flying" ||
      gameState ===
      "sinking"
    ) {
      return;
    }


    gameState =
      "ready";

    particles = [];

    lastResult = null;

    shareButton.hidden =
      true;

    distanceValue.textContent =
      "0.0m";

    skipsValue.textContent =
      "0";

    result.textContent =
      "文字を引っぱって投げてください";

    canvasHint.textContent =
      "文字をつかんで引っぱる";

    canvasHint.classList.remove(
      "hidden"
    );

    drawAim();
  }
);


// =========================
// TEST
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

  const values =
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
              stats.score.toFixed(2)
            ),

          最大水切り:
            stats.targetSkips
        };
      }
    );

  console.table(
    values
  );

  return values;
};


// =========================
// INITIALIZE
// =========================

angleValue.textContent =
  `${aimAngle.toFixed(1)}°`;

powerValue.textContent =
  `${Math.round(
    aimPower * 100
  )}%`;

drawAim();
