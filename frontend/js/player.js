function displayTips(analysisData) {
    const tipsList = document.getElementById('tipsList');
    const summaryBox = document.getElementById('summaryBox');
    const summaryText = document.getElementById('summaryText');
    
    // Reset de lijst
    tipsList.innerHTML = '';

    // 1. Verwerk de verhaalachtige samenvatting (Extra Feature)
    if (analysisData.summary) {
        summaryText.textContent = analysisData.summary;
        summaryBox.classList.remove('hidden');
    } else {
        summaryBox.classList.add('hidden');
    }

    // 2. Verwerk de losse highlights
    const highlights = analysisData.highlights || [];
    
    if (highlights.length === 0) {
        tipsList.innerHTML = '<li class="tip-item" style="list-style:none; text-align:center; color:#64748b;">Geen specifieke highlights gevonden voor deze focus.</li>';
        return;
    }

    highlights.forEach(item => {
        const li = document.createElement('li');
        li.className = `tip-item ${item.type.toLowerCase()}`;
        li.innerHTML = `
            <div class="tip-header">
                <span class="timestamp">${item.timestamp}</span>
                <span class="badge ${item.type.toLowerCase()}">${item.type}</span>
            </div>
            <strong class="tip-title">${item.title}</strong>
            <p class="tip-text">${item.tip}</p>
        `;
        li.addEventListener('click', () => jumpToTimestamp(item.timestamp));
        tipsList.appendChild(li);
    });
}

function jumpToTimestamp(timestampStr) {
    const video = document.getElementById('videoPlayer');
    const parts = timestampStr.split(':').map(Number);
    let seconds = parts.length === 2 ? (parts[0] * 60) + parts[1] : (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    if (!isNaN(seconds)) {
        video.currentTime = seconds;
        video.play();
    }
}