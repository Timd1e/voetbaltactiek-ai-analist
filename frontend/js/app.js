const videoInput = document.getElementById('videoInput');
const videoPlayer = document.getElementById('videoPlayer');
const uploadBtn = document.getElementById('uploadBtn');
const loadingDiv = document.getElementById('loading');
const dashboard = document.getElementById('dashboard');
const focusInput = document.getElementById('focusInput');
const dropZone = document.getElementById('dropZone');
const fileNameDisplay = document.getElementById('fileNameDisplay');

const sliderTrackContainer = document.querySelector('.slider-track-container');
const sliderTrack = document.getElementById('sliderTrack');
const handleStart = document.getElementById('handleStart');
const handleEnd = document.getElementById('handleEnd');
const labelStart = document.getElementById('labelStart');
const labelEnd = document.getElementById('labelEnd');

let duration = 0;
let currentStartSec = 0;
let currentEndSec = 0;
let isDraggingStart = false;
let isDraggingEnd = false;

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function getSecondsFromPercentage(percentage) { return (percentage / 100) * duration; }
function getPercentageFromSeconds(seconds) { return (seconds / duration) * 100; }

function updateSliderUI() {
    const startPercent = getPercentageFromSeconds(currentStartSec);
    const endPercent = getPercentageFromSeconds(currentEndSec);
    handleStart.style.left = `${startPercent}%`;
    handleEnd.style.left = `${endPercent}%`;
    sliderTrack.style.left = `${startPercent}%`;
    sliderTrack.style.width = `${endPercent - startPercent}%`;
    labelStart.textContent = formatTime(currentStartSec);
    labelEnd.textContent = formatTime(currentEndSec);
}

// Bestand laden handler
function handleFileSelection(file) {
    if (!file) return;
    fileNameDisplay.textContent = `Geselecteerd: ${file.name}`;
    dashboard.classList.remove('hidden');
    videoPlayer.src = URL.createObjectURL(file);
    videoPlayer.load();
    videoPlayer.onloadedmetadata = () => {
        duration = videoPlayer.duration;
        currentStartSec = 0;
        currentEndSec = Math.floor(duration);
        videoPlayer.controls = true;
        updateSliderUI();
    };
}

videoInput.addEventListener('change', () => handleFileSelection(videoInput.files[0]));

// Drag and drop
['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.style.borderColor = '#0056b3'; }, false);
});
['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => { e.preventDefault(); dropZone.style.borderColor = '#cbd5e1'; }, false);
});
dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === "video/mp4") {
        videoInput.files = files;
        handleFileSelection(files[0]);
    }
});

// Slider sleep functionaliteit
function calculateSecondsFromEvent(e) {
    const rect = sliderTrackContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return getSecondsFromPercentage((offsetX / rect.width) * 100);
}

handleStart.addEventListener('mousedown', () => isDraggingStart = true);
handleEnd.addEventListener('mousedown', () => isDraggingEnd = true);
window.addEventListener('mouseup', () => { isDraggingStart = false; isDraggingEnd = false; });

window.addEventListener('mousemove', (e) => {
    if (!isDraggingStart && !isDraggingEnd) return;
    const newTime = calculateSecondsFromEvent(e);
    if (isDraggingStart) {
        currentStartSec = Math.max(0, Math.min(newTime, currentEndSec - 1));
        videoPlayer.currentTime = currentStartSec;
    } else if (isDraggingEnd) {
        currentEndSec = Math.min(duration, Math.max(newTime, currentStartSec + 1));
        videoPlayer.currentTime = currentEndSec;
    }
    updateSliderUI();
});

// Upload naar backend
uploadBtn.addEventListener('click', async () => {
    const file = videoInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);
    formData.append('startTime', Math.floor(currentStartSec));
    formData.append('endTime', Math.floor(currentEndSec));
    formData.append('focus', focusInput.value);

    uploadBtn.disabled = true;
    videoInput.disabled = true;
    focusInput.disabled = true;
    loadingDiv.classList.remove('hidden');

    try {
        const response = await fetch('http://localhost:3000/api/upload-video', { method: 'POST', body: formData });
        const result = await response.json();
        if (result.success) displayTips(result.data);
        else alert('Fout: ' + result.error);
    } catch (err) {
        alert('Backend onbereikbaar.');
    } finally {
        uploadBtn.disabled = false;
        videoInput.disabled = false;
        focusInput.disabled = false;
        loadingDiv.classList.add('hidden');
    }
});