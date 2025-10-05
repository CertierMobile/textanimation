const textInput = document.getElementById('textInput');
const contentType = document.getElementById('contentType');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const textGroup = document.getElementById('textGroup');
const imageGroup = document.getElementById('imageGroup');
const fontGroup = document.getElementById('fontGroup');
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
let uploadedImage = null;

canvas.width = 1920;
canvas.height = 1080;

// Handle content type switching
contentType.addEventListener('change', function() {
    if (this.value === 'text') {
        textGroup.style.display = 'block';
        fontGroup.style.display = 'block';
        imageGroup.style.display = 'none';
    } else {
        textGroup.style.display = 'none';
        fontGroup.style.display = 'none';
        imageGroup.style.display = 'block';
    }
});

// Handle image upload
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                uploadedImage = img;
                imagePreview.innerHTML = '';
                imagePreview.appendChild(img);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

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
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.4);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    } else if (type === 'top' || type === 'bottom') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(150, now + 0.35);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1500, now);
        filter.frequency.exponentialRampToValueAtTime(300, now + 0.35);
        
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    } else if (type === 'zoom') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.5);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(3000, now + 0.5);
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    } else if (type === 'fade') {
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

function drawFrame(progress, content, style, font, fadeMultiplier, isImage = false) {
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const easeProgress = 1 - Math.pow(1 - progress, 3);
    let fadeProgress = Math.min(progress * fadeMultiplier, 1);

    if (isImage && content) {
        // Image rendering
        const maxWidth = canvas.width * 0.8;
        const maxHeight = canvas.height * 0.8;
        
        let imgWidth = content.width;
        let imgHeight = content.height;
        
        // Scale image to fit within bounds
        const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
        imgWidth *= scale;
        imgHeight *= scale;
        
        const centerX = canvas.width / 2 - imgWidth / 2;
        const centerY = canvas.height / 2 - imgHeight / 2;
        
        let x = centerX;
        let y = centerY;
        let alpha = 1;
        let imgScale = 1;
        
        switch(style) {
            case 'left':
                x = -imgWidth + (centerX + imgWidth) * easeProgress;
                alpha = fadeProgress;
                break;
            case 'right':
                x = canvas.width + (centerX - canvas.width) * easeProgress;
                alpha = fadeProgress;
                break;
            case 'top':
                y = -imgHeight + (centerY + imgHeight) * easeProgress;
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
                imgScale = 0.1 + 0.9 * easeProgress;
                alpha = fadeProgress;
                break;
        }
        
        ctx.globalAlpha = alpha;
        
        if (style === 'zoom') {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(imgScale, imgScale);
            ctx.drawImage(content, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
            ctx.restore();
        } else {
            ctx.drawImage(content, x, y, imgWidth, imgHeight);
        }
        
    } else {
        // Text rendering
        let baseFontSize = 120;
        let fontSize = baseFontSize;
        
        ctx.font = `bold ${baseFontSize}px "${font}"`;
        let textWidth = ctx.measureText(content).width;
        
        const maxWidth = canvas.width * 0.9;
        if (textWidth > maxWidth) {
            fontSize = Math.floor((maxWidth / textWidth) * baseFontSize);
            fontSize = Math.max(fontSize, 30);
        }
        
        ctx.font = `bold ${fontSize}px "${font}"`;
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;

        textWidth = ctx.measureText(content).width;
        const centerX = canvas.width / 2 - textWidth / 2;
        const centerY = canvas.height / 2 + (fontSize / 3);

        let x = centerX;
        let y = centerY;
        let alpha = 1;
        let scale = 1;

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
                y = -fontSize + (centerY + fontSize) * easeProgress;
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
            ctx.fillText(content, -textWidth / 2, fontSize / 3);
            ctx.restore();
        } else {
            ctx.fillText(content, x, y);
        }
    }

    ctx.globalAlpha = 1;
    ctx.shadowColor = 'transparent';
}

async function generateAnimation() {
    const isImageMode = contentType.value === 'image';
    
    let content;
    let font = fontStyle.value;
    let isImage = false;
    
    if (isImageMode) {
        if (!uploadedImage) {
            showStatus('Please upload an image!', 'error');
            return;
        }
        content = uploadedImage;
        isImage = true;
    } else {
        content = textInput.value.trim();
        if (!content) {
            showStatus('Please enter some text!', 'error');
            return;
        }
    }

    const style = animationStyle.value;
    const animDuration = parseFloat(duration.value) * 1000;
    const fadeMultiplier = getFadeSpeedMultiplier();
    
    renderBtn.disabled = true;
    downloadBtn.style.display = 'none';
    recordedChunks = [];
    soundPlayed = false;
    showStatus('Rendering animation...', 'info');

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
            a.download = 'animation.webm';
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
            drawFrame(progress, content, style, font, fadeMultiplier, isImage);
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

drawFrame(1, 'Preview
