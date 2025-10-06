window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("preview");
  const ctx = canvas.getContext("2d");
  const renderBtn = document.getElementById("renderBtn");
  const modeSelect = document.getElementById("mode");
  const textOptions = document.getElementById("textOptions");
  const imageOptions = document.getElementById("imageOptions");
  const textInput = document.getElementById("textInput");
  const fontStyle = document.getElementById("fontStyle");
  const animationStyle = document.getElementById("animationStyle");
  const flickerSpeedInput = document.getElementById("flickerSpeed");
  const durationInput = document.getElementById("duration");
  const textColor = document.getElementById("textColor");
  const shadowCheckbox = document.getElementById("shadow");
  const glowCheckbox = document.getElementById("glow");
  const soundUpload = document.getElementById("soundUpload");
  const downloadBtn = document.getElementById("downloadBtn");
  const status = document.getElementById("status");

  canvas.width = 1280;
  canvas.height = 720;

  let uploadedImage = null;
  let uploadedSound = null;

  // mode switch
  modeSelect.addEventListener("change", () => {
    if (modeSelect.value === "image") {
      textOptions.style.display = "none";
      imageOptions.style.display = "block";
    } else {
      textOptions.style.display = "block";
      imageOptions.style.display = "none";
    }
  });

  // image upload
  document.getElementById("imageUpload")?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => (uploadedImage = img);
    img.src = URL.createObjectURL(file);
  });

  // sound upload
  soundUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) uploadedSound = URL.createObjectURL(file);
  });

  // extra animations
  const extraAnimations = [
    { value: "none", text: "No Animation" },
    { value: "fontflicker", text: "Font Flicker" },
  ];
  extraAnimations.forEach((opt) => {
    if (![...animationStyle.options].some((o) => o.value === opt.value)) {
      const option = document.createElement("option");
      option.value = opt.value;
      option.textContent = opt.text;
      animationStyle.appendChild(option);
    }
  });

  // flicker fonts
  const flickerFonts = [
    "Dancing Script",
    "Pacifico",
    "Playball",
    "Great Vibes",
    "Italianno",
    "Satisfy",
    "Allura",
    "Cedarville Cursive",
  ];

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=" +
    flickerFonts.map((f) => f.replace(/ /g, "+")).join("&family=") +
    "&display=swap";
  document.head.appendChild(link);

  function drawFrame(progress) {
    ctx.fillStyle = "#0f1419";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const ease = 1 - Math.pow(1 - progress, 3);

    if (modeSelect.value === "text") {
      const text = textInput.value || "Sample Text";
      let currentFont = fontStyle.value;

      // font flicker
      if (animationStyle.value === "fontflicker") {
        const speed = parseInt(flickerSpeedInput.value);
        if (Math.random() < speed / 10) {
          const i = Math.floor(Math.random() * flickerFonts.length);
          currentFont = flickerFonts[i];
        }
      }

      ctx.font = `bold 120px "${currentFont}"`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = textColor.value;

      if (shadowCheckbox.checked) {
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 10;
      } else ctx.shadowBlur = 0;

      if (glowCheckbox.checked) {
        ctx.shadowColor = textColor.value;
        ctx.shadowBlur = 20;
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
          const scale = 0.5 + ease * 0.5;
          ctx.drawImage(
            uploadedImage,
            canvas.width / 2 - (size * scale) / 2,
            canvas.height / 2 - (size * scale) / 2,
            size * scale,
            size * scale
          );
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
    status.textContent = "Rendering...";
    downloadBtn.style.display = "none";

    const stream = canvas.captureStream(30);
    let audioCtx, audioStream;

    if (uploadedSound) {
      const audio = new Audio(uploadedSound);
      audio.crossOrigin = "anonymous";
      audioCtx = new AudioContext();
      const src = audioCtx.createMediaElementSource(audio);
      const dest = audioCtx.createMediaStreamDestination();
      src.connect(dest);
      src.connect(audioCtx.destination);
      audioStream = dest.stream;
      audio.play();
      stream.addTrack(audioStream.getAudioTracks()[0]);
    }

    const recordedChunks = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9,opus",
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      downloadBtn.onclick = () => {
        const a = document.createElement("a");
        a.href = url;
        a.download = "animation.webm";
        a.click();
      };
      downloadBtn.style.display = "block";
      status.textContent = "Done! Click download.";
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
});
