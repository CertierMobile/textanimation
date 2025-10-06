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
let videoBlob = null;

const flickerFonts = [
  "Pacifico","Great Vibes","Dancing Script","Allura","Playball","Satisfy","Parisienne",
  "Cookie","Courgette","Kaushan Script","Permanent Marker","Caveat","Indie Flower",
  "Shadows Into Light","Amatic SC","Patrick Hand","Architects Daughter","Homemade Apple",
  "Nothing You Could Do","Covered By Your Grace","Rock Salt","Reenie Beanie","Gloria Hallelujah",
  "Schoolbell","Crafty Girls","Coming Soon","Walter Turncoat","Sue Ellen Francisco",
  "Marck Script","Damion","Sacramento","Tangerine","Pinyon Script","Italianno",
  "Yesteryear","Euphoria Script","Aguafina Script","Engagement","Mea Culpa","Meie Script",
  "Mr De Haviland","Mr Dafoe","Mrs Saint Delafield","Rouge Script","Herr Von Muellerhoff"
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

document.getElementById("imageUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    uploadedImage = img;
    status.textContent = "Image loaded!";
  };
  img.src = URL.createObjectURL(file);
});

soundUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    uploadedSound = URL.createObjectURL(file);
    status.textContent = "Audio loaded!";
  }
});

function drawFrame(progress, flickerFont = null) {
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
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
    } else {
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

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
        y = yCenter + (1 - ease) * 500;
        break;
      case "left":
        x = xCenter - (1 - ease) * 700;
        break;
      case "right":
        x = xCenter + (1 - ease) * 700;
        break;
      case "zoom":
        ctx.save();
        const scale = 0.5 + ease * 0.5;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.drawImage(uploadedImage, -size / 2, -size / 2, size, size);
        ctx.restore();
        return;
      case "fade":
        ctx.globalAlpha = ease;
        break;
    }

    ctx.drawImage(uploadedImage, x, y, size, size);
    ctx.globalAlpha = 1;
  }
}

renderBtn.addEventListener("click", async () => {
  if (modeSelect.value === "image" && !uploadedImage) {
    status.textContent = "Please upload an image first!";
    return;
  }

  renderBtn.disabled = true;
  status.textContent = "Generating video...";
  downloadBtn.style.display = "none";

  try {
    const duration = parseFloat(durationInput.value);
    const fps = 30;
    const totalFrames = duration * fps;
    
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000
    });

    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      videoBlob = new Blob(chunks, { type: 'video/webm' });
      downloadBtn.href = URL.createObjectURL(videoBlob);
      downloadBtn.download = 'animation.webm';
      downloadBtn.style.display = "inline-block";
      status.textContent = "Video ready! Click download.";
      renderBtn.disabled = false;
    };

    mediaRecorder.start();

    if (animationStyle.value === "fontflicker") {
      const flickerSpeed = parseInt(flickerSpeedInput.value);
      const totalDuration = duration * 1000;
      let elapsed = 0;
      let lastFont = null;

      while (elapsed < totalDuration) {
        let randomFont;
        do {
          randomFont = flickerFonts[Math.floor(Math.random() * flickerFonts.length)];
        } while (randomFont === lastFont && flickerFonts.length > 1);
        
        lastFont = randomFont;
        drawFrame(1, randomFont);
        await new Promise(resolve => setTimeout(resolve, flickerSpeed));
        elapsed += flickerSpeed;
      }
    } else {
      for (let frame = 0; frame < totalFrames; frame++) {
        const progress = frame / totalFrames;
        drawFrame(progress);
        await new Promise(resolve => setTimeout(resolve, 1000 / fps));
      }
    }

    mediaRecorder.stop();

  } catch (error) {
    status.textContent = "Error: " + error.message;
    renderBtn.disabled = false;
  }
});
