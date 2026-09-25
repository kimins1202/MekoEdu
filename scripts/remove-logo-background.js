const sharp = require("sharp");
const path = require("path");

const input = path.join(__dirname, "../assets/images/meko-logo-dark.png");

const output = path.join(__dirname, "../assets/images/meko-logo-dark-rmbg.png");

async function removeBackground() {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Nhận diện nền đen
    const isBlack = r < 45 && g < 45 && b < 45;

    if (isBlack) {
      // Biến nền đen thành trong suốt
      data[i + 3] = 0;
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(output);

  console.log("Đã tạo:", output);
}

removeBackground();
