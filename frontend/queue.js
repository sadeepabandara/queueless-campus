const API_URL = 'http://localhost:8080/api/queue';

let currentQueueId = null;
let waitTimeInterval = null;
let queueListInterval = null;

// Load current queues on page load
window.onload = () => {
    loadCurrentQueues();
    checkExistingQueue();
    startQueueListAutoRefresh(); // NEW: Auto-refresh current queue list
};

// Check if user already in queue (stored in localStorage)
function checkExistingQueue() {
    const savedQueueId = localStorage.getItem('queueId');
    if (savedQueueId) {
        currentQueueId = savedQueueId;
        loadQueueStatus(savedQueueId);
    }
}

// Handle form submission - Join queue
const form = document.getElementById('queueForm');
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Joining Queue...';
    submitBtn.disabled = true;

    const data = {
        studentName: document.getElementById('studentName').value.trim(),
        serviceType: document.getElementById('serviceType').value,
        contactNumber: document.getElementById('contactNumber').value.trim(),
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            currentQueueId = result.queueEntry._id;

            // Save to localStorage
            localStorage.setItem('queueId', currentQueueId);

            showMessage('✓ Successfully joined the queue!', 'success');

            // Show queue status section
            displayQueueStatus(result.queueEntry);

            // Hide join form
            document.getElementById('joinQueueSection').style.display = 'none';
            document.getElementById('queueStatusSection').style.display =
                'block';

            // Start auto-refresh wait time every 30 seconds
            startWaitTimeRefresh();

            // Refresh queue list
            loadCurrentQueues();
        } else {
            const error = await response.json();
            showMessage(
                '✗ Failed to join queue: ' + (error.error || 'Unknown error'),
                'error',
            );
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(
            '✗ Error connecting to server. Please try again later.',
            'error',
        );
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Display queue status
function displayQueueStatus(queueEntry) {
    document.getElementById('queuePosition').textContent =
        `#${queueEntry.position}`;
    document.getElementById('estimatedWait').textContent = formatWaitTime(
        queueEntry.estimatedWaitTime,
    );
    document.getElementById('queueService').textContent =
        queueEntry.serviceType;

    const statusBadge = document.getElementById('queueStatus');
    statusBadge.textContent = queueEntry.status;
    statusBadge.className =
        'value status-badge status-' +
        queueEntry.status.toLowerCase().replace(' ', '-');
}

// Load queue status by ID
async function loadQueueStatus(queueId) {
    try {
        const response = await fetch(`${API_URL}/${queueId}`);

        if (response.ok) {
            const queueEntry = await response.json();

            // NEW: Check if status is Completed or Cancelled
            if (
                queueEntry.status === 'Completed' ||
                queueEntry.status === 'Cancelled'
            ) {
                // Clear localStorage and reset to join form
                handleQueueCompletion();
                return;
            }

            displayQueueStatus(queueEntry);

            // Show status section, hide form
            document.getElementById('joinQueueSection').style.display = 'none';
            document.getElementById('queueStatusSection').style.display =
                'block';

            // Start auto-refresh
            startWaitTimeRefresh();
        } else {
            // Queue entry not found, clear localStorage
            localStorage.removeItem('queueId');
            currentQueueId = null;
        }
    } catch (error) {
        console.error('Error loading queue status:', error);
    }
}

// NEW: Handle when queue is completed
function handleQueueCompletion() {
    // Clear localStorage
    localStorage.removeItem('queueId');
    currentQueueId = null;

    // Stop all intervals
    if (waitTimeInterval) {
        clearInterval(waitTimeInterval);
        waitTimeInterval = null;
    }

    // Show join form, hide status
    document.getElementById('joinQueueSection').style.display = 'block';
    document.getElementById('queueStatusSection').style.display = 'none';

    // Reset form
    form.reset();

    // Show message
    showMessage('✓ Your queue session has been completed!', 'success');

    // Refresh queue list
    loadCurrentQueues();
}

// Refresh wait time
async function refreshWaitTime() {
    if (!currentQueueId) return;

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.textContent = 'Refreshing...';
        refreshBtn.disabled = true;
    }

    try {
        const response = await fetch(`${API_URL}/${currentQueueId}/waittime`);

        if (response.ok) {
            const data = await response.json();

            // NEW: Check if status changed to Completed or Cancelled
            if (data.status === 'Completed' || data.status === 'Cancelled') {
                handleQueueCompletion();
                return;
            }

            document.getElementById('queuePosition').textContent =
                `#${data.position}`;
            document.getElementById('estimatedWait').textContent =
                formatWaitTime(data.estimatedWaitTime);

            const statusBadge = document.getElementById('queueStatus');
            statusBadge.textContent = data.status;
            statusBadge.className =
                'value status-badge status-' +
                data.status.toLowerCase().replace(' ', '-');

            showMessage('✓ Wait time updated!', 'success');
        } else {
            // If not found, handle completion
            handleQueueCompletion();
        }
    } catch (error) {
        console.error('Error refreshing wait time:', error);
        showMessage('✗ Error connecting to server', 'error');
    } finally {
        if (refreshBtn) {
            refreshBtn.textContent = '🔄 Refresh Wait Time';
            refreshBtn.disabled = false;
        }
    }
}

// Auto-refresh wait time every 30 seconds
function startWaitTimeRefresh() {
    if (waitTimeInterval) {
        clearInterval(waitTimeInterval);
    }

    waitTimeInterval = setInterval(() => {
        refreshWaitTime();
    }, 30000); // 30 seconds
}

// NEW: Auto-refresh current queue list every 30 seconds
function startQueueListAutoRefresh() {
    if (queueListInterval) {
        clearInterval(queueListInterval);
    }

    queueListInterval = setInterval(() => {
        loadCurrentQueues();
    }, 30000); // 30 seconds
}

// Leave queue
async function leaveQueue() {
    if (!currentQueueId) return;

    const confirmLeave = confirm('Are you sure you want to leave the queue?');
    if (!confirmLeave) return;

    const leaveBtn = document.getElementById('leaveBtn');
    leaveBtn.textContent = 'Leaving...';
    leaveBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/${currentQueueId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            // Clear localStorage
            localStorage.removeItem('queueId');
            currentQueueId = null;

            // Stop auto-refresh
            if (waitTimeInterval) {
                clearInterval(waitTimeInterval);
            }

            // Show join form, hide status
            document.getElementById('joinQueueSection').style.display = 'block';
            document.getElementById('queueStatusSection').style.display =
                'none';

            // Reset form
            form.reset();

            showMessage('✓ You have left the queue', 'success');

            // Refresh queue list
            loadCurrentQueues();
        } else {
            showMessage('✗ Failed to leave queue', 'error');
        }
    } catch (error) {
        console.error('Error leaving queue:', error);
        showMessage('✗ Error connecting to server', 'error');
    } finally {
        leaveBtn.textContent = 'Leave Queue';
        leaveBtn.disabled = false;
    }
}

// Load current queues
async function loadCurrentQueues(serviceType = null) {
    const queueList = document.getElementById('queueList');
    const emptyQueue = document.getElementById('emptyQueue');

    queueList.innerHTML =
        '<p style="text-align: center; padding: 2rem;">Loading...</p>';

    try {
        let url = `${API_URL}?status=Waiting`;
        if (serviceType && serviceType !== 'all') {
            url += `&serviceType=${encodeURIComponent(serviceType)}`;
        }

        const response = await fetch(url);

        if (response.ok) {
            const queues = await response.json();

            if (queues.length === 0) {
                queueList.innerHTML = '';
                emptyQueue.style.display = 'block';
            } else {
                emptyQueue.style.display = 'none';
                displayQueues(queues);
            }
        } else {
            queueList.innerHTML =
                '<p style="color: red; text-align: center;">Failed to load queues</p>';
        }
    } catch (error) {
        console.error('Error loading queues:', error);
        queueList.innerHTML =
            '<p style="color: red; text-align: center;">Error connecting to server</p>';
    }
}

// Display queues in list with UPDATED wait times
function displayQueues(queues) {
    const queueList = document.getElementById('queueList');
    queueList.innerHTML = '';

    // Group by service type
    const groupedQueues = {};
    queues.forEach((q) => {
        if (!groupedQueues[q.serviceType]) {
            groupedQueues[q.serviceType] = [];
        }
        groupedQueues[q.serviceType].push(q);
    });

    // Display each service group
    Object.keys(groupedQueues).forEach((serviceType) => {
        const serviceGroup = document.createElement('div');
        serviceGroup.className = 'queue-service-group';

        const serviceHeader = document.createElement('h3');
        serviceHeader.className = 'service-header';
        serviceHeader.innerHTML = `${serviceType} <span class="queue-count">${groupedQueues[serviceType].length} in queue</span>`;
        serviceGroup.appendChild(serviceHeader);

        groupedQueues[serviceType].forEach((queue) => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';

            // NEW: Calculate actual remaining wait time based on elapsed time
            const joinedAt = new Date(queue.joinedAt);
            const now = new Date();
            const elapsedMinutes = Math.floor((now - joinedAt) / 60000);
            const remainingWait = Math.max(
                0,
                queue.estimatedWaitTime - elapsedMinutes,
            );

            queueItem.innerHTML = `
                <div class="queue-position">#${queue.position}</div>
                <div class="queue-details">
                    <div class="queue-name">${escapeHtml(queue.studentName)}</div>
                    <div class="queue-wait">Wait: ${formatWaitTime(remainingWait)}</div>
                </div>
                <div class="queue-status">
                    <span class="status-badge status-${queue.status.toLowerCase()}">${queue.status}</span>
                </div>
            `;

            serviceGroup.appendChild(queueItem);
        });

        queueList.appendChild(serviceGroup);
    });
}

// Filter queues by service
function filterByService(serviceType) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Load filtered queues
    loadCurrentQueues(serviceType === 'all' ? null : serviceType);
}

// Format wait time
function formatWaitTime(minutes) {
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins > 1 ? 's' : ''}`;
}

// Show message
function showMessage(text, type) {
    const message = document.getElementById('message');
    message.textContent = text;
    message.className = 'message ' + type;
    message.style.display = 'block';

    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
