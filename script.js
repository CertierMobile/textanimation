const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d");
const renderBtn = document.getElementById("renderBtn");
const animationStyle = document.getElementById("animationStyle");
const flickerSpeedGroup = document.getElementById("flickerSpeedGroup");
const flickerSpeedInput = document.getElementById("flickerSpeed");
const durationInput = document.getElementById("duration");
const fontStyle = document.getElementById("fontStyle");
const textInput = document.getElementById("textInput");
const textColor = document.getElementById("textColor");
const shadow = document.getElementById("shadow");
const glow = document.getElementById("glow");
const downloadBtn = document.getElementById("downloadBtn");
const status = document.getElementById("status");

canvas.width = 1920;
canvas.height = 1080;

const flickerFonts = [
  "Pacifico", "Great Vibes", "Dancing Script", "Allura",
  "Playball", "Satisfy", "Parisienne", "Merriweather", "Cinzel"
];

animationStyle.addEventListener("change", () => {
  if (animationStyle.value === "fontflicker") {
    flickerSpeedGroup.style.display = "block";
  } else {
    flickerSpeedGroup.style.display = "none";
  }
});

function drawFrame(progress) {
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ease = 1 - Math.pow(1 - progress, 3);
  const text = textInput.value || "Sample Text";
  let currentFont = fontStyle.value;

  if (animationStyle.value === "fontflicker") {
    const now = performance.now();
    const speed = parseInt(flickerSpeedInput.value) || 100;
    const index = Math.floor(now / speed) % flickerFonts.length;
    currentFont = flickerFonts[index];
  }

  ctx.font = `bold 150px "${currentFont}"`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = textColor.value;
  ctx.shadowColor = glow.checked ? textColor.value : "rgba(0,0,0,0.6)";
  ctx.shadowBlur = shadow.checked || glow.checked ? 25 : 0;

  ctx.globalAlpha = 1;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
}

renderBtn.addEventListener("click", () => {
  status.textContent = "Rendering...";
  downloadBtn.style.display = "none";

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  const chunks = [];
  recorder.ondataavailable = e => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    downloadBtn.onclick = () => {
      const a = document.createElement("a");
      a.href = url;
      a.download = "animation.webm";
      a.click();
    };
    downloadBtn.style.display = "block";
    status.textContent = "Done! Click Download.";
  };

  recorder.start();
  const duration = parseFloat(durationInput.value) * 1000;
  const start = performance.now();

  function animate(now) {
    const progress = Math.min((now - start) / duration, 1);
    drawFrame(progress);
    if (progress < 1) requestAnimationFrame(animate);
    else recorder.stop();
  }
  requestAnimationFrame(animate);
});
