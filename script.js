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
 
