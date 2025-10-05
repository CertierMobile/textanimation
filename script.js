/* Animation + audio export (in-browser)
   - 100 programmatic synth presets (no hosting)
   - local audio upload
   - merged audio + canvas -> webm download
*/

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');
canvas.width = 1920; canvas.height = 1080;

const mode = document.getElementById('mode');
const textInput = document.getElementById('textInput');
const imageInput = document.getElementById('imageInput');
const fontStyle = document.getElementById('fontStyle');
const textColor = document.getElementById('textColor');
const animationStyle = document.getElementById('animationStyle');
const shadowToggle = document.getElementById('shadowToggle');
const glowToggle = document.getElementById('glowToggle');
const durationInput = document.getElementById('duration');

const soundSelect = document.getElementById('soundSelect');
const uploadAudio = document.getElementById('uploadAudio');
const previewSoundBtn = document.getElementById('previewSound');
const volumeControl = document.getElementById('volume');

const renderBtn = document.getElementById('renderBtn');
const status = document.getElementById('status');
const visitCountElement = document.querySelector('.visit-counter span');

let visits = parseInt(localStorage.getItem('visitCount')||'0'); visits++; localStorage.setItem('visitCount',visits); visitCountElement.textContent = visits;

let imageObj = null;
imageInput.addEventListener('change', e=>{
  const f=e.target.files[0]; if(!f) return;
  const img = new Image();
  img.onload = ()=> imageObj = img;
  img.src = URL.createObjectURL(f);
});

// Mode switch display
const textInputGroup = document.getElementById('textInputGroup');
const imageInputGroup = document.getElementById('imageInputGroup');
mode.addEventListener('change', ()=> {
  const val = mode.value;
  textInputGroup.style.display = val==='text' ? 'flex' : 'none';
  imageInputGroup.style.display = val==='image' ? 'flex' : 'none';
});

/* -------------------------
   WebAudio setup & presets
   ------------------------- */
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null; // created on demand
let masterDestination = null; // MediaStreamDestination for capture
let currentSynthNode = null;
let uploadedAudioElement = null;
let uploadedSourceNode = null;

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new AudioContextClass();
    masterDestination = audioCtx.createMediaStreamDestination();
  }
}

// Create 100 synth presets programmatically
const synthPresets = [];
const waveformOptions = ['sine','square','sawtooth','triangle'];
for (let i=0;i<100;i++){
  const base = 110 + Math.round(i * 6.5);
  synthPresets.push({
    id: `preset_${i+1}`,
    name: `Preset ${i+1} — ${waveformOptions[i%waveformOptions.length].slice(0,3).toUpperCase()} ${base}Hz`,
    type: waveformOptions[i%waveformOptions.length],
    freq: base,
    attack: 0.01 + (i%6)*0.02,
    decay: 0.15 + (i%8)*0.03,
    sustain: 0.2 + ((i%5)/5)*0.6,
    release: 0.1 + ((i%7)*0.02)
  });
}

// Populate sound select
synthPresets.forEach(p => {
  const o = document.createElement('option');
  o.value = p.id; o.textContent = p.name; soundSelect.appendChild(o);
});
// Add a 'none' option
const noneOpt = document.createElement('option'); noneOpt.value='none'; noneOpt.textContent='(No built-in sound)'; soundSelect.insertBefore(noneOpt, soundSelect.firstChild);
soundSelect.value = synthPresets[0].id;

/* Play synth preset once (returns promise resolves when finished) */
function playSynthPreset(preset, when=0, dur=1.0, gain=0.9){
  ensureAudioContext();
  return new Promise(resolve=>{
    const now = audioCtx.currentTime + when;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = preset.type;
    osc.frequency.setValueAtTime(preset.freq, now);

    // small modulation for variety
    const lfo = audioCtx.createOscillator();
    lfo.type='sine'; lfo.frequency.value = 3 + Math.random()*6;
    const lfoGain = audioCtx.createGain(); lfoGain.gain.value = (preset.freq*0.003);
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    lfo.start(now); lfo.stop(now + dur + 0.2);

    // envelope
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + preset.attack);
    gainNode.gain.linearRampToValueAtTime(preset.sustain * gain, now + preset.attack + preset.decay);
    gainNode.gain.linearRampToValueAtTime(0.0001, now + dur + preset.release);

    // filter for texture
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(8000, preset.freq * 8), now);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(masterDestination); // to capture stream
    gainNode.connect(audioCtx.destination); // hear preview

    osc.start(now); osc.stop(now + dur + 0.05);

    // stop and cleanup
    osc.onended = () => {
      try{ lfo.disconnect(); }catch(e){}
      try{ osc.disconnect(); }catch(e){}
      try{ gainNode.disconnect(); }catch(e){}
      resolve();
    };
  });
}

/* Preview button plays either uploaded audio or built-in synth */
previewSoundBtn.addEventListener('click', async ()=>{
  ensureAudioContext();
  const uploaded = uploadAudio.files[0];
  const vol = parseFloat(volumeControl.value);
  if (uploaded) {
    // play uploaded
    if (uploadedAudioElement) { uploadedAudioElement.pause(); uploadedAudioElement = null; }
    const url = URL.createObjectURL(uploaded);
    uploadedAudioElement = new Audio(url);
    uploadedAudioElement.volume = vol;
    // route to audioCtx so it appears in masterDestination when exporting
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (uploadedSourceNode) { try{ uploadedSourceNode.disconnect(); }catch(e){} uploadedSourceNode=null; }
    uploadedSourceNode = audioCtx.createMediaElementSource(uploadedAudioElement);
    uploadedSourceNode.connect(masterDestination);
    uploadedSourceNode.connect(audioCtx.destination);
    uploadedAudioElement.onended = ()=> { /* cleanup */ };
    uploadedAudioElement.play();
  } else {
    // play synth
    const presetId = soundSelect.value;
    if (presetId === 'none') { status.textContent = 'No built-in sound chosen.'; return; }
    const preset = synthPresets.find(p=>p.id===presetId);
    if (!preset) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    await playSynthPreset(preset, 0, parseFloat(durationInput.value), parseFloat(volumeControl.value));
  }
});

/* If user picks an uploaded file, clear built-in selection (visual hint) */
uploadAudio.addEventListener('change', ()=> {
  if (uploadAudio.files.length>0) soundSelect.value='none';
});

/* -------------------------
   Animation drawing functions
   ------------------------- */
function clearPreview(){
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(0,0,canvas.width,canvas.height);
}
clearPreview();

function drawFrame(progress, text, anim, font, color, opts){
  ctx.fillStyle = '#00ff00'; ctx.fillRect(0,0,canvas.width,canvas.height); // greenscreen

  const ease = 1 - Math.pow(1 - progress, 3);
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);

  let offsetX=0, offsetY=0, alpha=1, scale=1, rotation=0;

  switch(anim){
    case 'left': offsetX = -canvas.width/2 + ease*(canvas.width/2); break;
    case 'right': offsetX = canvas.width/2 - ease*(canvas.width/2); break;
    case 'top': offsetY = -canvas.height/2 + ease*(canvas.height/2); break;
    case 'bottom': offsetY = canvas.height/2 - ease*(canvas.height/2); break;
    case 'fade': alpha = ease; break;
    case 'zoom': scale = 0.2 + 0.8*ease; break;
    case 'rotate': rotation = ease * Math.PI*2; break;
    case 'bounce': offsetY = Math.sin(ease*Math.PI*2)*80*(1-ease); break;
    case 'wave': offsetY = Math.sin(ease*6)*50; break;
    case 'typewriter': /* handled below */ break;
  }

  ctx.translate(offsetX, offsetY);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  if (mode.value === 'text') {
    // dynamic font size
    let base = 150;
    ctx.font = `bold ${base}px "${font}"`;
    let tw = ctx.measureText(text).width;
    const maxW = canvas.width * 0.8;
    if (tw > maxW) {
      base = Math.max(40, Math.floor(base * (maxW / tw)));
      ctx.font = `bold ${base}px "${font}"`;
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (opts.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 10;
    } else ctx.shadowColor='transparent';

    if (opts.glow) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 60;
    }

    ctx.fillStyle = color;
    if (anim === 'typewriter') {
      const chars = Math.floor(ease * text.length);
      ctx.fillText(text.substring(0, chars), 0, 0);
    } else {
      ctx.fillText(text, 0, 0);
    }
  } else {
    // image mode: draw auto-resized imageObj
    if (imageObj) {
      const maxDim = 520;
      let w = imageObj.width, h = imageObj.height;
      const aspect = w/h;
      if (w > h) { if (w > maxDim) { w = maxDim; h = w / aspect; } }
      else { if (h > maxDim) { h = maxDim; w = h * aspect; } }
      ctx.drawImage(imageObj, -w/2, -h/2, w, h);
    } else {
      // placeholder text
      ctx.font = 'bold 48px "VT323"';
      ctx.fillStyle = '#fff';
      ctx.fillText('No image selected', 0, 0);
    }
  }

  ctx.restore();
}

/* -------------------------
   Exporting (canvas + audio)
   ------------------------- */
async function exportAnimationWithAudio(){
  ensureAudioContext();
  // stop any playing uploaded audio
  if (uploadedAudioElement) { try{ uploadedAudioElement.pause(); }catch(e){} }

  // Prepare masterDestination (already created in ensureAudioContext)
  // If uploaded file present, create source node and connect to masterDestination
  if (uploadAudio.files[0]) {
    const file = uploadAudio.files[0];
    if (uploadedAudioElement) { uploadedAudioElement.pause(); uploadedAudioElement=null; }
    const url = URL.createObjectURL(file);
    uploadedAudioElement = new Audio(url);
    uploadedAudioElement.crossOrigin = 'anonymous';
    uploadedAudioElement.volume = parseFloat(volumeControl.value);
    uploadedSourceNode = audioCtx.createMediaElementSource(uploadedAudioElement);
    uploadedSourceNode.connect(masterDestination);
    uploadedSourceNode.connect(audioCtx.destination);
  }

  // If built-in synth selected, we'll schedule synth to play through masterDestination
  const builtInId = soundSelect.value;
  const useSynth = (builtInId !== 'none' && (!uploadAudio.files[0]));

  // Create combined stream
  const canvasStream = canvas.captureStream(60); // 60fps if possible
  const audioStream = masterDestination.stream;   // from WebAudio
  const combined = new MediaStream();
  canvasStream.getVideoTracks().forEach(t=>combined.addTrack(t));
  audioStream.getAudioTracks().forEach(t=>combined.addTrack(t));

  // Create MediaRecorder
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' :
               (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' : 'video/webm');
  let recorder;
  try {
    recorder = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 3_000_000 });
  } catch(err) {
    status.textContent = 'Recording not supported in this browser.'; return;
  }

  const chunks = [];
  recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animation_export_${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
    status.textContent = 'Export complete — file downloaded.';
    // cleanup uploaded element
    if (uploadedAudioElement) { uploadedAudioElement.pause(); uploadedAudioElement.src=''; uploadedAudioElement=null; }
  };

  // Start recording slightly before actual playback to ensure audio captured
  recorder.start(100);

  // Ensure audio context resumed for user gesture restrictions
  if (audioCtx.state === 'suspended') await audioCtx.resume();

  // Play audio and animate simultaneously
  const dur = parseFloat(durationInput.value);
  const startTime = audioCtx.currentTime + 0.15; // small lead
  let synthPromise = Promise.resolve();

  if (useSynth) {
    const preset = synthPresets.find(p => p.id === builtInId);
    if (preset) synthPromise = playSynthPreset(preset, 0.15, dur, parseFloat(volumeControl.value));
  } else if (uploadedAudioElement) {
    // play uploaded audio synced with canvas animation
    uploadedAudioElement.currentTime = 0;
    // small wait to allow play to start
    const playPromise = uploadedAudioElement.play();
    if (playPromise && playPromise.catch) {
      // catch any autoplay policy rejection and resume audio context then play again
      playPromise.catch(async ()=>{ await audioCtx.resume(); uploadedAudioElement.play(); });
    }
  }

  // run canvas animation in sync (no strict sample-accurate sync but good enough)
  await runAnimation(dur);

  // wait for synth upload to finish (small padding)
  await new Promise(r => setTimeout(r, 300));
  recorder.stop();
}

/* runAnimation returns promise resolved when animation finished */
function runAnimation(dur){
  return new Promise(resolve => {
    const text = textInput.value || 'Hello World!';
    const anim = animationStyle.value;
    const font = fontStyle.value;
    const color = textColor.value;
    const opts = { shadow: shadowToggle.checked, glow: glowToggle.checked };

    let start = null;
    function frame(ts){
      if (!start) start = ts;
      const elapsed = (ts - start)/1000;
      const progress = Math.min(elapsed/dur, 1);
      drawFrame(progress, text, anim, font, color, opts);
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

/* Render button behavior */
renderBtn.addEventListener('click', async ()=>{
  status.textContent = 'Preparing export...';
  try {
    await exportAnimationWithAudio();
  } catch (err) {
    console.error(err);
    status.textContent = 'Error during export: ' + (err.message || err);
  }
});

/* Make sure audioCtx created on first gesture to avoid autoplay blocks */
document.addEventListener('click', () => { if (!audioCtx) ensureAudioContext(); }, { once:true });
