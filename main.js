const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const input = document.getElementById("characterInput");
const throwButton = document.getElementById("throwButton");
const result = document.getElementById("result");

function drawScene(character = "水") {

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
  const waterY = 270;

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

  // 投げる文字
  ctx.fillStyle = "#222";

  ctx.font = "80px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    character,
    100,
    180
  );
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

    drawScene(character);

    result.textContent =
      `「${character}」を投げる準備完了`;
  }
);

drawScene("水");
