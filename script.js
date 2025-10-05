const textInput = document.getElementById('textInput');
const fontStyle = document.getElementById('fontStyle');
const animationStyle = document.getElementById('animationStyle');
const duration = document.getElementById('duration');
const fadeSpeed = document.getElementById('fadeSpeed');
const renderBtn = document.getElementById('renderBtn');
const downloadBtn = document.getElementById('downloadBtn');
const status = document.getElementById('status');
const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

let mediaRecorder;
let recordedChunks = [];
let animationFrameId;
let audioContext;
let soundPlayed = false;

canvas.width = 1920;
canvas.height = 1080;

// Initialize Audio Context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Generate whoosh sound effect
function playWhooshSound(type) {
    if (soundPlayed) return;
    soundPlayed = true;
    
    initAudio();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    const now = audioContext.currentTime;
    
    if (type === 'left' || type === 'right') {
        // Horizontal whoosh - sweeping frequency
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.4);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    } else if (type === 'top' || type === 'bottom') {
        // Vertical swipe - different frequency pattern
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.35);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);
        
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    } else if (type === 'zoom') {
        // Zoom sound - rising pitch
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(3000, now + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    } else if (type === 'fade') {
        // Fade sound - soft shimmer
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.setValueAtTime(880, now + 0.3);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    }
    
    oscillator.start(now);
    oscillator.stop(now + 0.6);
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
}

function hideStatus() {
    status.className = 'status';
}

function getFadeSpeedMultiplier() {
    const speed = fadeSpeed.value;
    switch(speed) {
        case 'slow': return 0.5;
        case 'fast': return 2;
        default: return 1;
    }
}

function drawFrame(progress, text, style, font, fadeMultiplier) {
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
    
    // Adjusted fade for fade-based animations
    let fadeProgress = Math.min(progress * fadeMultiplier, 1);

    switch(style) {
        case 'left':
            x = -textWidth + (centerX + textWidth) * easeProgress;
            alpha = fadeProgress;
            break;
        case 'right':
            x = canvas.width + (centerX - canvas.width) * easeProgress;
            alpha = fadeProgress;
            break;
        case 'top':
            y = -100 + (centerY + 100) * easeProgress;
            alpha = fadeProgress;
            break;
        case 'bottom':
            y = canvas.height + (centerY - canvas.height) * easeProgress;
            alpha = fadeProgress;
            break;
        case 'fade':
            alpha = fadeProgress;
            break;
        case 'zoom':
            scale = 0.1 + 0.9 * easeProgress;
            alpha = fadeProgress;
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
    const animDuration = parseFloat(duration.value) * 1000;
    const fadeMultiplier = getFadeSpeedMultiplier();
    
    renderBtn.disabled = true;
    downloadBtn.style.display = 'none';
    recordedChunks = [];
    soundPlayed = false;
    showStatus('Rendering animation...', 'info');

    // Play sound effect
    playWhooshSound(style);

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

    const fps = 30;
    const totalFrames = (animDuration / 1000) * fps;
    let frame = 0;

    function animate() {
        if (frame <= totalFrames) {
            const progress = frame / totalFrames;
            drawFrame(progress, text, style, font, fadeMultiplier);
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

drawFrame(1, 'Preview', 'fade', 'Arial', 1);
