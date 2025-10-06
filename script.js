const canvas = document.getElementById("preview");
const ctx = canvas.getContext("2d");
const renderBtn = document.getElementById("renderBtn");
const textOptions = document.getElementById("textOptions");
const imageOptions = document.getElementById("imageOptions");
const textInput = document.getElementById("textInput");
const fontStyle = document.getElementById("fontStyle");
const animationStyle = document.getElementById("animationStyle");
const durationInput = document.getElementById("duration");
const textColor = document.getElementById("textColor");
const shadowCheckbox = document.getElementById("shadow");
const glowCheckbox = document.getElementById("glow");
const downloadBtn = document.getElementById("downloadBtn");
const status = document.getElementById("status");
const flickerSpeedGroup = document.getElementById("flickerSpeedGroup");
const flickerSpeedInput = document.getElementById("flickerSpeed");
const imageDropZone = document.getElementById("imageDropZone");
const imageUpload = document.getElementById("imageUpload");

canvas.width = 1920;
canvas.height = 1080;
let uploadedImage = null;
let videoBlob = null;
let currentMode = 'text';

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

// Mode switching
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const mode = btn.dataset.mode;
    currentMode = mode;
    
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (mode === 'image') {
      textOptions.classList.add('hidden');
      imageOptions.classList.remove('hidden');
    } else {
      textOptions.classList.remove('hidden');
      imageOptions.classList.add('hidden');
    }
  });
});

// Image upload
imageUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const img = new Image();
  img.onload = () => {
    uploadedImage = img;
    imageDropZone.classList.add('has-file');
    imageDropZone.querySelector('.upload-text').textContent = file.name;
    status.textContent = "✓ Image loaded successfully!";
  };
  img.src = URL.createObjectURL(file);
});

// Drag and drop
imageDropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  imageDropZone.style.borderColor = '#00ffff';
});

imageDropZone.addEventListener('dragleave', () => {
  imageDropZone.style.borderColor = 'rgba(0, 255, 255, 0.3)';
});

imageDropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  imageDropZone.style.borderColor = 'rgba(0, 255, 255, 0.3)';
  
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    imageUpload.files = e.dataTransfer.files;
    imageUpload.dispatchEvent(new Event('change'));
  }
});

animationStyle.addEventListener("change", () => {
  if (animationStyle.value === "fontflicker") {
    flickerSpeedGroup.style.display = "block";
  } else {
    flickerSpeedGroup.style.display = "none";
  }
});

function drawFrame(progress, flickerFont = null) {
  // Clear canvas with green screen background
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ease = 1 - Math.pow(1 - progress, 3);

  if (currentMode === "text") {
    const text = textInput.value || "Sample Text";
    ctx.font = `bold 150px "${flickerFont || fontStyle.value}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Reset shadows
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    if (shadowCheckbox.checked) {
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
    }

    if (glowCheckbox.checked) {
      ctx.shadowColor = textColor.value;
      ctx.shadowBlur = 25;
    }

    ctx.fillStyle = textColor.value;

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
      case "none":
      case "fontflicker":
        // No position animation
        break;
    }

    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  } else if (uploadedImage) {
    const maxSize = 600;
    const imgAspect = uploadedImage.width / uploadedImage.height;
    let width = maxSize;
    let height = maxSize;
    
    if (imgAspect > 1) {
      height = maxSize / imgAspect;
    } else {
      width = maxSize * imgAspect;
    }

    const xCenter = canvas.width / 2 - width / 2;
    const yCenter = canvas.height / 2 - height / 2;

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
        ctx.drawImage(uploadedImage, -width / 2, -height / 2, width, height);
        ctx.restore();
        return;
      case "fade":
        ctx.globalAlpha = ease;
        break;
      case "none":
        // No animation
        break;
    }

    ctx.drawImage(uploadedImage, x, y, width, height);
    ctx.globalAlpha = 1;
  }
}

renderBtn.addEventListener("click", async () => {
  if (currentMode === "image" && !uploadedImage) {
    status.textContent = "⚠️ Please upload an image first!";
    return;
  }

  renderBtn.disabled = true;
  status.textContent = "⚙️ Generating video...";
  downloadBtn.style.display = "none";

  try {
    const duration = parseFloat(durationInput.value);
    const fps = 30;
    
    // Check MediaRecorder support
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    
    let selectedMimeType = null;
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }

    if (!selectedMimeType) {
      throw new Error('No supported video format found');
    }

    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: selectedMimeType,
      videoBitsPerSecoding: 5000000
    });

    const chunks = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      videoBlob = new Blob(chunks, { type: selectedMimeType });
      const url = URL.createObjectURL(videoBlob);
      downloadBtn.href = url;
      
      // Set appropriate file extension
      const extension = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
      downloadBtn.download = `animation.${extension}`;
      downloadBtn.style.display = "inline-block";
      status.textContent = "✓ Video ready! Click to download.";
      renderBtn.disabled = false;
    };

    mediaRecorder.onerror = (e) => {
      console.error('MediaRecorder error:', e);
      status.textContent = "❌ Recording error occurred";
      renderBtn.disabled = false;
    };

    // Start recording
    mediaRecorder.start(100); // Collect data every 100ms

    if (animationStyle.value === "fontflicker") {
      // Font flicker animation
      const flickerSpeed = parseInt(flickerSpeedInput.value);
      const totalDuration = duration * 1000;
      let elapsed = 0;
      let lastFont = null;

      const flickerInterval = setInterval(() => {
        if (elapsed >= totalDuration) {
          clearInterval(flickerInterval);
          setTimeout(() => mediaRecorder.stop(), 500);
          return;
        }

        let randomFont;
        do {
          randomFont = flickerFonts[Math.floor(Math.random() * flickerFonts.length)];
        } while (randomFont === lastFont && flickerFonts.length > 1);
        
        lastFont = randomFont;
        drawFrame(1, randomFont);
        elapsed += flickerSpeed;
      }, flickerSpeed);

    } else {
      // Regular animation
      const totalFrames = duration * fps;
      let currentFrame = 0;

      const animationInterval = setInterval(() => {
        if (currentFrame >= totalFrames) {
          clearInterval(animationInterval);
          setTimeout(() => mediaRecorder.stop(), 500);
          return;
        }

        const progress = currentFrame / totalFrames;
        drawFrame(progress);
        currentFrame++;
        
        // Update status
        const percent = Math.round((currentFrame / totalFrames) * 100);
        status.textContent = `⚙️ Generating video... ${percent}%`;
      }, 1000 / fps);
    }

  } catch (error) {
    console.error('Video generation error:', error);
    status.textContent = "❌ Error: " + error.message;
    renderBtn.disabled = false;
  }
});

// Initial preview
drawFrame(1);
