// Elementen ophalen
const videoInput = document.getElementById('videoInput');
const videoPlayer = document.getElementById('videoPlayer');
const uploadBtn = document.getElementById('uploadBtn');
const loadingDiv = document.getElementById('loading');
const dashboard = document.getElementById('dashboard');

// Tijdsbalk elementen
const sliderTrackContainer = document.querySelector('.slider-track-container');
const sliderTrack = document.getElementById('sliderTrack');
const handleStart = document.getElementById('handleStart');
const handleEnd = document.getElementById('handleEnd');
const labelStart = document.getElementById('labelStart');
const labelEnd = document.getElementById('labelEnd');

// Staat van de applicatie
let duration = 0;
let currentStartSec = 0;
let currentEndSec = 0;
let isDraggingStart = false;
let isDraggingEnd = false;

// Helper: Formatteer secondes naar mm:ss
function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// Helper: Zet percentage om naar seconde
function getSecondsFromPercentage(percentage) {
    return (percentage / 100) * duration;
}

// Helper: Zet seconde om naar percentage
function getPercentageFromSeconds(seconds) {
    return (seconds / duration) * 100;
}

// 1. Visuele Tijdsbalk Updaten (Posities en Labels)
function updateSliderUI() {
    const startPercent = getPercentageFromSeconds(currentStartSec);
    const endPercent = getPercentageFromSeconds(currentEndSec);

    // FIX: Positioneren van de handles en track
    handleStart.style.left = `${startPercent}%`;
    handleEnd.style.left = `${endPercent}%`;

    sliderTrack.style.left = `${startPercent}%`;
    sliderTrack.style.width = `${endPercent - startPercent}%`;

    labelStart.textContent = formatTime(currentStartSec);
    labelEnd.textContent = formatTime(currentEndSec);
}

// 2. Video Laden en Tijdsbalk Initiëren
videoInput.addEventListener('change', () => {
    const file = videoInput.files[0];
    if (!file) return;

    dashboard.classList.remove('hidden');

    const videoUrl = URL.createObjectURL(file);
    videoPlayer.src = videoUrl;
    videoPlayer.load();

    videoPlayer.onloadedmetadata = () => {
        duration = videoPlayer.duration;
        currentStartSec = 0;
        currentEndSec = Math.floor(duration);
        
        // Activeer controls weer
        videoPlayer.controls = true;
        
        updateSliderUI();
    };
});

// 3. SLEEP LOGICA FIX

function calculateSecondsFromEvent(e) {
    const rect = sliderTrackContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let offsetX = clientX - rect.left;
    
    offsetX = Math.max(0, Math.min(offsetX, rect.width));
    
    const percentage = (offsetX / rect.width) * 100;
    return getSecondsFromPercentage(percentage);
}

// Start slepen
handleStart.addEventListener('mousedown', () => isDraggingStart = true);
handleEnd.addEventListener('mousedown', () => isDraggingEnd = true);
handleStart.addEventListener('touchstart', () => isDraggingStart = true);
handleEnd.addEventListener('touchstart', () => isDraggingStart = true);

// Stop slepen
window.addEventListener('mouseup', () => {
    isDraggingStart = false;
    isDraggingEnd = false;
});
window.addEventListener('touchend', () => {
    isDraggingStart = false;
    isDraggingEnd = false;
});

// Het slepen zelf
window.addEventListener('mousemove', handleMouseMove);
window.addEventListener('touchmove', handleMouseMove);

function handleMouseMove(e) {
    if (!isDraggingStart && !isDraggingEnd) return;
    
    e.preventDefault(); 
    const newTime = calculateSecondsFromEvent(e);

    if (isDraggingStart) {
        currentStartSec = Math.min(newTime, currentEndSec - 1);
        currentStartSec = Math.max(0, currentStartSec);
        
        // LIVE PREVIEW: Scrub naar starttijd
        videoPlayer.currentTime = currentStartSec;
    } 
    else if (isDraggingEnd) {
        currentEndSec = Math.max(newTime, currentStartSec + 1);
        currentEndSec = Math.min(duration, currentEndSec);
        
        // LIVE PREVIEW: Scrub naar eindtijd
        videoPlayer.currentTime = currentEndSec;
    }

    updateSliderUI();
}

// 4. Fragment Verzenden naar Backend
uploadBtn.addEventListener('click', async () => {
    const file = videoInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);
    formData.append('startTime', Math.floor(currentStartSec));
    formData.append('endTime', Math.floor(currentEndSec));

    uploadBtn.disabled = true;
    videoInput.disabled = true;
    loadingDiv.classList.remove('hidden');

    try {
        const response = await fetch('http://localhost:3000/api/upload-video', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            displayTips(result.data);
        } else {
            alert('Fout: ' + result.error);
        }
    } catch (err) {
        console.error('Netwerkfout:', err);
        alert('Backend onbereikbaar.');
    } finally {
        uploadBtn.disabled = false;
        videoInput.disabled = false;
        loadingDiv.classList.add('hidden');
    }
});