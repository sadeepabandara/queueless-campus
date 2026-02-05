// queue.js - Virtual Queue Management

const API_URL = 'http://localhost:5001/api/queue';

// Join virtual queue
async function joinQueue(appointmentId) {
    try {
        const response = await fetch(`${API_URL}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ appointmentId })
        });

        const data = await response.json();
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error joining queue:', error);
        return { success: false, error: 'Failed to join queue' };
    }
}

// Get user's queue position
async function getMyPosition(appointmentId, studentName) {
    try {
        const response = await fetch(
            `${API_URL}/my-position/${appointmentId}?studentName=${encodeURIComponent(studentName)}`
        );

        const data = await response.json();
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error getting position:', error);
        return { success: false, error: 'Failed to get position' };
    }
}

// Get all queue entries (for staff)
async function getAllQueueEntries() {
    try {
        const response = await fetch(`${API_URL}/all`);
        const data = await response.json();
        return { success: true, data };
    } catch (error) {
        console.error('Error getting queue entries:', error);
        return { success: false, error: 'Failed to get queue entries' };
    }
}

// Update queue status (for staff)
async function updateQueueStatus(queueId, status) {
    try {
        const response = await fetch(`${API_URL}/update/${queueId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });

        const data = await response.json();
        if (response.ok) {
            return { success: true, data };
        } else {
            return { success: false, error: data.error };
        }
    } catch (error) {
        console.error('Error updating queue status:', error);
        return { success: false, error: 'Failed to update status' };
    }
}

// Display queue position on UI
function displayQueuePosition(queueData) {
    const queueContainer = document.getElementById('queueContainer');
    if (!queueContainer) return;

    queueContainer.innerHTML = `
        <div class="queue-card">
            <h3>Virtual Queue</h3>
            <p class="queue-number">Your Queue Number: <strong>#${queueData.queueNumber}</strong></p>
            <p class="queue-status">Status: <span class="status-${queueData.status.toLowerCase()}">${queueData.status}</span></p>
            <p class="wait-time">Estimated Wait: <strong>${queueData.estimatedWaitTime} minutes</strong></p>
            <p class="waiting-ahead">People ahead of you: <strong>${queueData.waitingAhead}</strong></p>
        </div>
    `;
}

// Initialize queue display
async function initQueueDisplay(appointmentId, studentName) {
    const result = await getMyPosition(appointmentId, studentName);
    if (result.success) {
        displayQueuePosition(result.data);
    } else {
        console.log(result.error);
    }
}

// Export functions for use in other scripts
window.QueueAPI = {
    joinQueue,
    getMyPosition,
    getAllQueueEntries,
    updateQueueStatus
};
