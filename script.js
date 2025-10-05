const textInput = document.getElementById('textInput');
const fontStyle = document.getElementById('fontStyle');
const animationStyle = document.getElementById('animationStyle');
const renderBtn = document.getElementById('renderBtn');
const downloadBtn = document.getElementById('downloadBtn');
const status = document.getElementById('status');
const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

let mediaRecorder;
let recordedChunks = [];
let animationFrameId;

canvas.width = 1920;
canvas.height = 1080;

function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
}

function hideStatus() {
    status.className = 'status';
}

function drawFrame(progress, text, style, font) {
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `bold 120px "${font}"`;
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 5;
    ctx.shadowOffsetY = 5;

    const textWidth = ctx.measureText(text).width;
    const centerX = canvas.width / 2 - textWidth / 2;
    const centerY = canvas.height / 2 + 40;

    let x = centerX;
    let y = centerY;
    let alpha = 1;
    let scale = 1;

    const easeProgress = 1 - Math.pow(1 - progress, 3);

    switch(style) {
        case 'left':
            x = -textWidth + (centerX + textWidth) * easeProgress;
            break;
        case 'right':
            x = canvas.width + (centerX - canvas.width) * easeProgress;
            break;
        case 'top':
            y = -100 + (centerY + 100) * easeProgress;
            break;
        case 'bottom':
            y = canvas.height + (centerY - canvas.height) * easeProgress;
            break;
        case 'fade':
            alpha = easeProgress;
            break;
        case 'zoom':
            scale = 0.1 + 0.9 * easeProgress;
            alpha = easeProgress;
            break;
    }

    ctx.globalAlpha = alpha;
    
    if (style === 'zoom') {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.fillText(text, -textWidth / 2, 40);
        ctx.restore();
    } else {
        ctx.fillText(text, x, y);
    }

    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
}

async function generateAnimation() {
    const text = textInput.value.trim();
    if (!text) {
        showStatus('Please enter some text!', 'error');
        return;
    }

    const style = animationStyle.value;
    const font = fontStyle.value;
    
    renderBtn.disabled = true;
    downloadBtn.style.display = 'none';
    recordedChunks = [];
    showStatus('Rendering animation...', 'info');

    const stream = canvas.captureStream(30);
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000
    });

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'text-animation.webm';
            a.click();
        };
        downloadBtn.style.display = 'block';
        showStatus('Animation ready! Click download to save.', 'success');
        renderBtn.disabled = false;
    };

    mediaRecorder.start();

    const duration = 2000;
    const fps = 30;
    const totalFrames = (duration / 1000) * fps;
    let frame = 0;

    function animate() {
        if (frame <= totalFrames) {
            const progress = frame / totalFrames;
            drawFrame(progress, text, style, font);
            frame++;
            animationFrameId = requestAnimationFrame(animate);
        } else {
            setTimeout(() => {
                mediaRecorder.stop();
            }, 100);
        }
    }

    animate();
}

renderBtn.addEventListener('click', generateAnimation);

drawFrame(1, 'Preview', 'fade', 'Arial');
