const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("characterInput");
const throwButton = document.getElementById("throwButton");
const result = document.getElementById("result");

const waterY = 270;

let animationId = null;

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 空
  ctx.fillStyle = "#f8fbff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

function drawInitialScene(character = "水") {
  drawBackground();

  drawCharacter(
    character,
    100,
    180,
    0
  );
}

function throwCharacter(character) {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }

  let x = 100;
  let y = 180;

  let vx = 10;
  let vy = -1;

  let angle = 0;
  let rotationSpeed = 0.15;

  let skips = 0;

  const gravity = 0.22;

  function animate() {
    drawBackground();

    x += vx;
    y += vy;

    vy += gravity;

    angle += rotationSpeed;

    // 水面に接触
    if (y >= waterY - 25 && vy > 0) {
      skips++;

      // 水面で跳ね返る
      vy = -4.5;

      // 徐々に速度を落とす
      vx *= 0.88;

      rotationSpeed *= 0.9;

      y = waterY - 26;
    }

    drawCharacter(
      character,
      x,
      y,
      angle
    );

    result.textContent =
      `水切り ${skips}回`;

    // 終了条件
    if (
      x > canvas.width + 50 ||
      vx < 1.8 ||
      skips >= 15
    ) {
      result.textContent =
        `「${character}」 水切り ${skips}回`;

      animationId = null;

      return;
    }

    animationId =
      requestAnimationFrame(animate);
  }

  animate();
}

throwButton.addEventListener(
  "click",
  () => {
    const character =
      Array.from(input.value.trim())[0];

    if (!character) {
      result.textContent =
        "文字を入力してください";

      return;
    }

    throwCharacter(character);
  }
);

drawInitialScene("水");
