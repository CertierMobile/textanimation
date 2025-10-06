const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d");

const renderBtn = document.getElementById("renderBtn");
const modeSelect = document.getElementById("mode");
const textOptions = document.getElementById("textOptions");
const imageOptions = document.getElementById("imageOptions");
const textInput = document.getElementById("textInput");
const fontStyle = document.getElementById("fontStyle");
const animationStyle = document.getElementById("animationStyle");
const durationInput = document.getElementById("duration");
const textColor = document.getElementById("textColor");
const shadowCheckbox = document.getElementById("shadow");
const glowCheckbox = document.getElementById("glow");
const soundUpload = document.getElementById("soundUpload");
const downloadBtn = document.getElementById("downloadBtn");
const status = document.getElementById("status");
const flickerSpeedGroup = document.getElementById("flickerSpeedGroup");
const flickerSpeedInput = document.getElementById("flickerSpeed");

canvas.width = 1920;
canvas.height = 1080;
let uploadedImage = null;
let uploadedSound = null;

// Font Flicker list (100+ storytelling/cursive)
const flickerFonts = [
  "Pacifico","Great Vibes","Dancing Script","Allura","Playball","Satisfy","Parisienne",
  "Meriweather","Cinzel","Roboto","Open Sans","Lora","Quicksand","Raleway","Roboto Slab",
  "Slabo 27px","Zilla Slab","Playfair Display","Arvo","Josefin Slab","Cabin","PT Serif",
  "Crimson Pro","Spectral","Source Serif Pro","EB Garamond","Cardo","Vollkorn","Gloock",
  "Fira Sans","Nunito","Source Sans Pro","Exo","Titillium Web","Ubuntu","Work Sans","Overpass",
  "Archivo","Anton","Oswald","Roboto Condensed","PT Sans","Cabin Condensed","Archivo Narrow",
  "Lexend","Barlow","Barlow Condensed","Barlow Semi Condensed","Lexend Deca","Lexend Exa","Lexend Giga",
  "Lexend Peta","Lexend Tera","Lexend Zeta"
];

modeSelect.addEventListener("change", () => {
  if (modeSelect.value === "image") {
    textOptions.style.display = "none";
    imageOptions.style.display = "block";
  } else {
    textOptions.style.display = "block";
    imageOptions.style.display = "none";
  }
});

animationStyle.addEventListener("change", () => {
  if (animationStyle.value === "fontflicker") {
    flickerSpeedGroup.style.display = "block";
  } else {
    flickerSpeedGroup.style.display = "none";
  }
});

document.getElementById("imageUpload")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => (uploadedImage = img);
  img.src = URL.createObjectURL(file);
});

soundUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) uploadedSound = URL.createObjectURL(file);
});

function drawFrame(progress, flickerFont=null) {
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ease = 1 - Math.pow(1 - progress, 3);

  if (modeSelect.value === "text") {
    const text = textInput.value || "Sample Text";

    ctx.font = `bold 150px "${flickerFont || fontStyle.value}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = textColor.value;

    if (shadowCheckbox.checked) {
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 15;
    } else ctx.shadowBlur = 0;

    if (glowCheckbox.checked) {
      ctx.shadowColor = textColor.value;
      ctx.shadowBlur = 25;
    }

    let x = canvas.width / 2;
    let y = canvas.height / 2;

    switch (animationStyle.value) {
      case "top":
        y = canvas.height / 2 - (1 - ease) * 500;
        break;
      case "bottom":
        y = canvas.height / 2 + (1 - ease) * 500;
        break;
      case "left":
        x = canvas.width / 2 - (1 - ease) * 700;
        break;
      case "right":
        x = canvas.width / 2 + (1 - ease) * 700;
        break;
      case "zoom":
        ctx.save();
        const scale = 0.5 + ease * 0.5;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.fillText(text, 0, 0);
        ctx.restore();
        return;
      case "fade":
        ctx.globalAlpha = ease;
        break;
    }

    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  } else if (uploadedImage) {
    const size = 400;
    const xCenter = canvas.width / 2 - size / 2;
    const yCenter = canvas.height / 2 - size / 2;

    let x = xCenter;
    let y = yCenter;

    switch (animationStyle.value) {
      case "top":
        y = yCenter - (1 - ease) * 500;
        break;
      case "bottom":
        y = yCenter + (1 - ease)

