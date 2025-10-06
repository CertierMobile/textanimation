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
let currentMode = 'text';

// Cursive fonts for flicker effect
const cursiveFonts = [
  "Pacifico","Great Vibes","Dancing Script","Allura","Playball","Satisfy",
  "Parisienne","Cookie","Courgette","Kaushan Script","Caveat","Indie Flower",
  "Shadows Into Light","Amatic SC","Patrick Hand","Architects Daughter",
  "Homemade Apple","Nothing You Could Do","Covered By Your Grace","Reenie Beanie",
  "Gloria Hallelujah","Schoolbell","Coming Soon","Sue Ellen Francisco","Marck Script",
  "Damion","Sacramento","Tangerine","Pinyon Script","Italianno","Yesteryear",
  "Euphoria Script","Aguafina Script","Engagement","Mea Culpa","Meie Script",
  "Mr De Haviland","Mr Dafoe","Mrs Saint Delafield","Rouge Script","Herr Von Muellerhoff"
];

let fontFlickerState = { availableFonts: [...cursiveFonts], usedFonts: [], currentFont: null };

// Mode switching
document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentMode = btn.dataset.mode;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    textOptions.classList.toggle('hidden', currentMode === 'image');
    imageOptions.classList.toggle('hidden', currentMode === 'text');
  });
});

// Image upload
imageUpload.addEventListener("change", e => {
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
imageDropZone.addEventListener('dragover', e => { 
  e.preventDefault(); 
  imageDropZone.style.borderColor = '#00ffff'; 
});

imageDropZone.addEventListener('dragleave', () => { 
  imageDropZone.style.borderColor = 'rgba(0, 255, 255, 0.3)'; 
});

imageDropZone.addEventListener('drop', e => {
  e.preventDefault();
  imageDropZone.style.borderColor = 'rgba(0, 255, 255, 0.3)';
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    imageUpload.files = e.dataTransfer.files;
    imageUpload.dispatchEvent(new Event('change'));
  }
});

// Animation option changes
animationStyle.addEventListener("change", () => {
  flickerSpeedGroup.style.display = animationStyle.value === "fontflicker" ? "block" : "none";
});

// Font flicker helpers
function resetFontFlicker() {
  fontFlickerState.availableFonts = [...cursiveFonts];
  fontFlickerState.usedFonts = [];
  fontFlickerState.currentFont = null;
}

function getNextFlickerFont() {
  if (fontFlickerState.availableFonts.length === 0) resetFontFlicker();
  const idx = Math.floor(Math.random() * fontFlickerState.availableFonts.length);
  const font = fontFlickerState.availableFonts.splice(idx, 1)[0];
  fontFlickerState.usedFonts.push(font);
  fontFlickerState.currentFont = font;
  return font;
}

// Draw a single frame
function drawFrame(progress, flickerFont = null) {
  ctx.fillStyle = "#00ff00";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const ease = 1 - Math.pow(1 - progress, 3);

  if (currentMode === "text") {
    const text = textInput.value || "Sample Text";
    const currentFontFamily = flickerFont || fontStyle.value;
    ctx.font = `bold 150px "${currentFontFamily}"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = shadowCheckbox.checked ? 15 : 0;
    ctx.shadowOffsetX = shadowCheckbox.checked ? 5 : 0;
    ctx.shadowOffsetY = shadowCheckbox.checked ? 5 : 0;
    ctx.shadowColor = glowCheckbox.checked ? textColor.value : "rgba(0,0,0,0.6)";
    ctx.fillStyle = textColor.value;

    let x = canvas.width / 2;
    let y = canvas.height / 2;

    switch(animationStyle.value){
      case "top": y -= (1 - ease) * 500; break;
      case "bottom": y += (1 - ease) * 500; break;
      case "left": x -= (1 - ease) * 700; break;
      case "right": x += (1 - ease) * 700; break;
      case "zoom": 
        ctx.save(); 
        ctx.translate(canvas.width/2, canvas.height/2); 
        ctx.scale(0.5 + ease*0.5, 0.5 + ease*0.5); 
        ctx.fillText(text, 0, 0); 
        ctx.restore(); 
        return;
      case "fade": ctx.globalAlpha = ease; break;
    }
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1;
  } else if (uploadedImage) {
    const maxSize = 600;
    const aspect = uploadedImage.width / uploadedImage.height;
    let width = maxSize, height = maxSize;
    if (aspect > 1) height = maxSize / aspect;
    else width = maxSize * aspect;

    let x = canvas.width / 2 - width/2;
    let y = canvas.height / 2 - height/2;

    switch(animationStyle.value){
      case "top": y -= (1 - ease) * 500; break;
      case "bottom": y += (1 - ease) * 500; break;
      case "left": x -= (1 - ease) * 700; break;
      case "right": x += (1 - ease) * 700; break;
      case "zoom": 
        ctx.save(); 
        ctx.translate(canvas.width/2, canvas.height/2); 
        ctx.scale(0.5+ease*0.5, 0.5+ease*0.5); 
        ctx.drawImage(uploadedImage, -width/2, -height/2, width, height); 
        ctx.restore(); 
        return;
      case "fade": ctx.globalAlpha = ease; break;
    }
    ctx.drawImage(uploadedImage, x, y, width, height);
    ctx.globalAlpha = 1;
  }
}

// Main render function - WebM only
renderBtn.addEventListener("click", async () => {
  if (currentMode === "image" && !uploadedImage) { 
    status.textContent = "⚠️ Upload an image first!"; 
    return; 
  }

  renderBtn.disabled = true;
  status.textContent = "⚙️ Generating WebM video...";
  downloadBtn.style.display = "none";

  try {
    const duration = parseFloat(durationInput.value);
    const fps = 30;
    
    // Try different WebM codecs for better compatibility
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
    }
    
    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { 
      mimeType: mimeType, 
      videoBitsPerSecond: 5000000 
    });
    
    const chunks = [];
    recorder.ondataavailable = e => { 
      if(e.data.size > 0) chunks.push(e.data); 
    };

    recorder.onstop = () => {
      const webmBlob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(webmBlob);

      downloadBtn.href = url;
      downloadBtn.download = 'animation.webm';
      downloadBtn.style.display = "inline-block";
      status.textContent = "✅ WebM ready! Click to download.";
      renderBtn.disabled = false;
    };

    recorder.start(100);

    // Handle different animation types
    if(animationStyle.value === "fontflicker") {
      resetFontFlicker();
      const flickerSpeed = parseInt(flickerSpeedInput.value);
      const totalDuration = duration * 1000;
      let elapsed = 0;
      const totalFlickers = Math.floor(totalDuration / flickerSpeed);

      status.textContent = `⚡ Font flickering... 0/${totalFlickers}`;
      
      const interval = setInterval(() => {
        if(elapsed >= totalDuration) { 
          clearInterval(interval); 
          setTimeout(() => recorder.stop(), 500); 
          return; 
        }
        
        const nextFont = getNextFlickerFont();
        drawFrame(1, nextFont);
        elapsed += flickerSpeed;
        status.textContent = `⚡ Font: "${nextFont}" (${Math.floor(elapsed/flickerSpeed)}/${totalFlickers})`;
      }, flickerSpeed);
      
    } else {
      const totalFrames = duration * fps;
      let currentFrame = 0;
      
      const interval = setInterval(() => {
        if(currentFrame >= totalFrames) { 
          clearInterval(interval); 
          setTimeout(() => recorder.stop(), 500); 
          return; 
        }
        
        drawFrame(currentFrame / totalFrames);
        currentFrame++;
        status.textContent = `⚙️ Generating video... ${Math.round((currentFrame/totalFrames)*100)}%`;
      }, 1000/fps);
    }

  } catch(error) {
    console.error('Render error:', error);
    status.textContent = "❌ Error: " + error.message;
    renderBtn.disabled = false;
  }
});

// Initial preview
drawFrame(1);
