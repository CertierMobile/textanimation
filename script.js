const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
canvas.width = 1920;
canvas.height = 1080;

const textInput = document.getElementById('textInput');
const fontStyle = document.getElementById('fontStyle');
const animationStyle = document.getElementById('animationStyle');
const duration = document.getElementById('duration');
const fadeSpeed = document.getElementById('fadeSpeed');
const bgImageInput = document.getElementById('bgImage');
const renderBtn = document.getElementById('renderBtn');
const visitCountElement = document.getElementById('visitCount');

let bgImage = null;

// Load background image
bgImageInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) {
    const img = new Image();
    img.onload = () => bgImage = img;
    img.src = URL.createObjectURL(file);
  }
});

// Visit counter
let visits = parseInt(localStorage.getItem('visitCount') || '0');
visits++;
localStorage.setItem('visitCount', visits);
visitCountElement.textContent = visits;

function drawFrame(progress, text, anim, font) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (bgImage) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

  const fontSize = 160;
  ctx.font = `bold ${fontSize}px "${font}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';

  const x = canvas.width / 2;
  const y = canvas.height / 2;
  let alpha = 1;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let rotation = 0;

  const ease = 1 - Math.pow(1 - progress, 3);

  switch (anim) {
    case 'left': offsetX = -canvas.width / 2 + ease * canvas.width / 2; break;
    case 'right': offsetX = canvas.width / 2 - ease * canvas.width / 2; break;
    case 'top': offsetY = -canvas.height / 2 + ease * canvas.height / 2; break;
    case 'bottom': offsetY = canvas.height / 2 - ease * canvas.height / 2; break;
    case 'fade': alpha = ease; break;
    case 'zoom': scale = 0.2 + ease * 0.8; break;
    case 'rotate': rotation = ease * Math.PI * 2; break;
    case 'bounce': offsetY = Math.sin(ease * Math.PI * 2) * 80 * (1 - ease); break;
    case 'wave': offsetY = Math.sin(ease * 6) * 50; break;
    case 'typewriter':
      const chars = Math.floor(ease * text.length);
      text = text.substring(0, chars);
      break;
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + offsetX, y + offsetY);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function startAnimation() {
  const text = textInput.value || 'Hello World!';
  const anim = animationStyle.value;
  const font = fontStyle.value;
  const dur = parseFloat(duration.value);
  let start = null;

  function animate(ts) {
    if (!start) start = ts;
    const elapsed = (ts - start) / 1000;
    const progress = Math.min(elapsed / dur, 1);
    drawFrame(progress, text, anim, font);
    if (progress < 1) requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

renderBtn.addEventListener('click', startAnimation);
