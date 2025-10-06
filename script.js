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

// Fonts for flicker
const flickerFonts = [
  "Pacifico","Great Vibes","Dancing Script","Allura","Playball","Satisfy","Parisienne",
  "Merriweather","Cinzel","Roboto","Open Sans","Lora","Quicksand","Raleway","Roboto Slab",
  "Slabo 27px","Zilla Slab","Playfair Display","Arvo","Josefin Slab","Cabin","PT Serif",
  "Crimson Pro","Spectral","Source Serif Pro","EB Garamond","Cardo","Vollkorn","Gloock",
  "Fira Sans","Nunito","Source Sans Pro","Exo","Titillium Web","Ubuntu","Work Sans","Overpass",
  "Archivo","Anton","Oswald","Roboto Condensed","PT Sans","Cabin Condensed","Archivo Narrow",
  "Lexend","Barlow","Barlow Condensed","Barlow Semi Condensed","Lexend Deca","Lexend Exa",
  "Lexend Giga","Lexend Peta","Lexend Tera","Lexend Zeta"
];

// Mode toggle
modeSelect.addEventListener("change", () => {
  if (modeSelect.value === "image") {
    textOptions.style.display = "none";
    imageOptions.style.display = "block";
  } else {
    textOptions.style.display = "block";
    imageOptions.style.display = "none";
  }
});

// Show flicker speed only for Font Flicker
animationStyle.addEventListener("change", () => {
  flickerSpeedGroup.style.display = animationStyle.value === "fontflicker" ? "block" : "none";
});

// Image upload
document.getElementById("imageUpload")?.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => (uploadedImage = img);
  img.src = URL.createObjectURL(file);
});

// Sound upload
soundUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) uploadedSound = URL.createObjectURL(file);
});

// Draw frame
function drawFrame(progress, currentFont = null) {
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ease = 1 - Math.pow(1 - progress, 3);

  if (modeSelect.value === "text") {
    const text = textInput.value || "Sample Text";
    ctx.font = `bold 150px "${currentFont || fontStyle.value}"`;
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
      case "top": y = canvas.height / 2 - (1 - ease) * 500; break;
      case "bottom": y = canvas.height / 2 + (1 - ease) * 500; break;
      case "left": x = canvas.width / 2 - (1 - ease) * 700; break;
      case "right": x = canvas.width / 2 + (1 - ease) * 700; break;
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
      case "top": y = yCenter - (1 - ease) * 500; break;
      case "bottom": y = yCenter + (1 - ease) * 500; break;
      case "left": x = xCenter - (1 - ease) * 700; break;
      case "right": x = xCenter + (1 - ease) * 700; break;
      case "zoom":
        const scale = 0.5 + ease * 0.5;
        const imgW = size * scale;
        const imgH = size * scale;
        ctx.drawImage(uploadedImage, canvas.width/2-imgW/2, canvas.height/2-imgH/2, imgW, imgH);
        return;
      case "fade": ctx.globalAlpha = ease; break;
    }

    ctx.drawImage(uploadedImage, x, y, size, size);
    ctx.globalAlpha = 1;
  }
}

// Render
renderBtn.addEventListener("click", () => {
  status.textContent = "Rendering...";
  downloadBtn.style.display = "none";

  const stream = canvas.captureStream(30);
  let audioStream;

  if (uploadedSound) {
    const audio = new Audio(uploadedSound);
    audio.crossOrigin = "anonymous";
    const audioCtx = new AudioContext();
    const src = audioCtx.createMediaElementSource(audio);
    const dest = audioCtx.createMediaStreamDestination();
    src.connect(dest);
    src.connect(audioCtx.destination);
    audioStream = dest.stream;
    audio.play();
    stream.addTrack(audioStream.getAudioTracks()[0]);
  }

  const recordedChunks = [];
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" });

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    downloadBtn.href = url;
    downloadBtn.download = "animation.webm";
    downloadBtn.style.display = "inline-block";
    status.textContent = "Exported successfully!";
  };

  recorder.start();
  const duration = parseFloat(durationInput.value) * 1000;
  const start = performance.now();

  if (animationStyle.value === "fontflicker") {
    const flickerSpeed = parseInt(flickerSpeedInput.value) || 100;
    let lastTime = 0;

    function flickerAnimate(now) {
      const progress = Math.min((now - start) / duration, 1);
      if (now - lastTime > flickerSpeed) {
        const currentFont = flickerFonts[Math.floor(Math.random() * flickerFonts.length)];
        drawFrame(progress, currentFont);
        lastTime = now;
      }
      if (progress < 1) requestAnimationFrame(flickerAnimate);
      else recorder.stop();
    }

    requestAnimationFrame(flickerAnimate);

  } else {
    function animate(now) {
      const progress = Math.min((now - start) / duration, 1);
      drawFrame(progress);
      if (progress < 1) requestAnimationFrame(animate);
      else recorder.stop();
    }

    requestAnimationFrame(animate);
  }
});
