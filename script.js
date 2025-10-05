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
const visitCountElement = document.getElementById('visitCount');

let mediaRecorder;
let recordedChunks = [];
let animationFrameId;
let audioContext;
let soundPlayed = false;
let uploadedImage = null;

canvas.width = 1920;
canvas.height = 1080;

// Visit counter functionality
function updateVisitCounter() {
    let visits = parseInt(localStorage.getItem('visitCount') || '0');
    visits++;
    localStorage.setItem('visitCount', visits.toString());
    visitCountElement.textContent = visits;
}

// Initialize visit counter on page load
updateVisitCounter();

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
        filter.frequency.exponentia
