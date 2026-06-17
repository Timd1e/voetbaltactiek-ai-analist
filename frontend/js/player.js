function displayTips(tips) {
    const tipsList = document.getElementById('tipsList');
    tipsList.innerHTML = '';

    tips.forEach(item => {
        const li = document.createElement('li');
        
        // Voeg de algemene klasse én de specifieke type-klasse toe (aanvallend of verdedigend)
        li.className = `tip-item ${item.type.toLowerCase()}`;
        
        // Bouw de HTML op met een header waarin de timestamp én een badge staan
        li.innerHTML = `
            <div class="tip-header">
                <span class="timestamp">${item.timestamp}</span>
                <span class="badge ${item.type.toLowerCase()}">${item.type}</span>
            </div>
            <strong class="tip-title">${item.title}</strong>
            <p class="tip-text">${item.tip}</p>
        `;

        li.addEventListener('click', () => {
            jumpToTimestamp(item.timestamp);
        });

        tipsList.appendChild(li);
    });
}

function jumpToTimestamp(timestampStr) {
    const video = document.getElementById('videoPlayer');
    const parts = timestampStr.split(':').map(Number);
    let seconds = 0;
    
    if (parts.length === 2) {
        seconds = (parts[0] * 60) + parts[1];
    } else if (parts.length === 3) {
        seconds = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
    }

    if (!isNaN(seconds)) {
        video.currentTime = seconds;
        video.play(); // Start met spelen vanaf dat moment, maar kan nu gewoon gepauzeerd worden via de video controls!
    }
}