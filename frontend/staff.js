const APPOINTMENTS_API = 'http://localhost:8080/api/appointments';
const QUEUE_API = 'http://localhost:8080/api/queue';

let allAppointments = [];
let allQueueEntries = [];
let currentQueueFilter = '';
let queueAutoRefreshInterval = null; // NEW: Auto-refresh interval

// ==================== INITIALIZATION ====================

window.onload = () => {
    // Load appointments by default
    loadAppointments();
    setupEventListeners();
};

function setupEventListeners() {
    // Appointment form
    const appointmentForm = document.getElementById('updateAppointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', handleAppointmentUpdate);
    }

    // Queue form
    const queueForm = document.getElementById('updateQueueForm');
    if (queueForm) {
        queueForm.addEventListener('submit', handleQueueUpdate);
    }

    // Close modals on outside click
    window.onclick = (event) => {
        const appointmentModal = document.getElementById('appointmentModal');
        const queueModal = document.getElementById('queueModal');

        if (event.target === appointmentModal) {
            closeAppointmentModal();
        }
        if (event.target === queueModal) {
            closeQueueModal();
        }
    };
}

// ==================== TAB SWITCHING ====================

function switchTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach((tab) => tab.classList.remove('active'));

    // Update sections
    const sections = document.querySelectorAll('.tab-content');
    sections.forEach((section) => section.classList.remove('active'));

    if (tabName === 'appointments') {
        document.getElementById('appointmentsTab').classList.add('active');
        document.getElementById('appointmentsSection').classList.add('active');
        loadAppointments();

        // NEW: Stop queue auto-refresh when switching to appointments
        stopQueueAutoRefresh();
    } else if (tabName === 'queue') {
        document.getElementById('queueTab').classList.add('active');
        document.getElementById('queueSection').classList.add('active');
        loadQueue();

        // NEW: Start queue auto-refresh when switching to queue tab
        startQueueAutoRefresh();
    }
}

// NEW: Start auto-refresh for queue (every 30 seconds)
function startQueueAutoRefresh() {
    // Clear any existing interval
    stopQueueAutoRefresh();

    // Set new interval
    queueAutoRefreshInterval = setInterval(() => {
        loadQueue();
    }, 30000); // 30 seconds
}

// NEW: Stop auto-refresh
function stopQueueAutoRefresh() {
    if (queueAutoRefreshInterval) {
        clearInterval(queueAutoRefreshInterval);
        queueAutoRefreshInterval = null;
    }
}

// ==================== APPOINTMENTS FUNCTIONS ====================

async function loadAppointments() {
    const tableBody = document.querySelector('#appointmentsTable tbody');
    const loading = document.getElementById('loadingAppointments');
    const emptyState = document.getElementById('emptyAppointments');

    if (loading) loading.style.display = 'block';
    if (tableBody) tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';

    try {
        const response = await fetch(APPOINTMENTS_API);
        if (!response.ok) throw new Error('Failed to fetch appointments');

        allAppointments = await response.json();

        if (loading) loading.style.display = 'none';

        if (allAppointments.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            displayAppointments(allAppointments);
        }
    } catch (error) {
        console.error('Error loading appointments:', error);
        if (loading) loading.style.display = 'none';
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger-color);">Failed to load appointments</td></tr>`;
        }
    }
}

function displayAppointments(appointments) {
    const tableBody = document.querySelector('#appointmentsTable tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    appointments.forEach((app) => {
        const row = document.createElement('tr');
        const statusClass = getAppointmentStatusClass(app.status);
        const formattedDate = formatDate(app.appointmentDate);
        const formattedTime = formatTime(app.appointmentTime);

        row.innerHTML = `
            <td><strong>${escapeHtml(app.studentName)}</strong></td>
            <td>${escapeHtml(app.serviceType)}</td>
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td>${app.notes ? escapeHtml(app.notes) : '<em style="color: #999;">No notes</em>'}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(app.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success" onclick="openAppointmentModal('${app._id}')">Update</button>
                    <button class="btn btn-danger" onclick="deleteAppointment('${app._id}')">Delete</button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function getAppointmentStatusClass(status) {
    const statusMap = {
        Booked: 'status-booked',
        Confirmed: 'status-confirmed',
        Completed: 'status-completed',
        Cancelled: 'status-cancelled',
        'No-Show': 'status-no-show',
    };
    return statusMap[status] || 'status-booked';
}

function filterAppointmentsByDate() {
    const filterDate = document.getElementById('filterDate').value;
    if (!filterDate) {
        displayAppointments(allAppointments);
        return;
    }
    const filtered = allAppointments.filter(
        (app) => app.appointmentDate === filterDate,
    );
    displayAppointments(filtered);
}

function clearAppointmentFilter() {
    const filterDate = document.getElementById('filterDate');
    if (filterDate) filterDate.value = '';
    displayAppointments(allAppointments);
}

function openAppointmentModal(appointmentId) {
    const appointment = allAppointments.find(
        (app) => app._id === appointmentId,
    );
    if (!appointment) {
        alert('Appointment not found');
        return;
    }

    document.getElementById('appointmentUpdateId').value = appointment._id;
    document.getElementById('appointmentUpdateStatus').value =
        appointment.status;
    document.getElementById('appointmentUpdateDate').value =
        appointment.appointmentDate;
    document.getElementById('appointmentUpdateTime').value =
        appointment.appointmentTime;
    document.getElementById('appointmentUpdateNotes').value = appointment.notes;

    const message = document.getElementById('appointmentUpdateMessage');
    if (message) message.style.display = 'none';

    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    const form = document.getElementById('updateAppointmentForm');
    if (form) form.reset();
}

async function handleAppointmentUpdate(e) {
    e.preventDefault();

    const message = document.getElementById('appointmentUpdateMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    const appointmentId = document.getElementById('appointmentUpdateId').value;
    const updateData = {
        status: document.getElementById('appointmentUpdateStatus').value,
        appointmentDate: document.getElementById('appointmentUpdateDate').value,
        appointmentTime: document.getElementById('appointmentUpdateTime').value,
        notes: document.getElementById('appointmentUpdateNotes').value,
    };

    try {
        const response = await fetch(`${APPOINTMENTS_API}/${appointmentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });

        if (response.ok) {
            showMessage(
                message,
                '✓ Appointment updated successfully!',
                'success',
            );
            setTimeout(() => {
                closeAppointmentModal();
                loadAppointments();
            }, 1500);
        } else {
            const error = await response.json();
            showMessage(
                message,
                '✗ Failed to update: ' + (error.error || 'Unknown error'),
                'error',
            );
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(message, '✗ Error connecting to server', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function deleteAppointment(appointmentId) {
    const appointment = allAppointments.find(
        (app) => app._id === appointmentId,
    );
    if (!appointment) {
        alert('Appointment not found');
        return;
    }

    const confirmMsg = `Delete appointment?\n\nStudent: ${appointment.studentName}\nService: ${appointment.serviceType}\nDate: ${formatDate(appointment.appointmentDate)}`;

    if (!confirm(confirmMsg)) return;

    try {
        const response = await fetch(`${APPOINTMENTS_API}/${appointmentId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            alert('✓ Appointment deleted successfully');
            loadAppointments();
        } else {
            alert('✗ Failed to delete appointment');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('✗ Error connecting to server');
    }
}

// ==================== QUEUE FUNCTIONS ====================

async function loadQueue() {
    const tableBody = document.querySelector('#queueTable tbody');
    const loading = document.getElementById('loadingQueue');
    const emptyState = document.getElementById('emptyQueue');

    if (loading) loading.style.display = 'block';
    if (tableBody) tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';

    try {
        let url = QUEUE_API;
        if (currentQueueFilter) {
            url += `?serviceType=${encodeURIComponent(currentQueueFilter)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch queue');

        allQueueEntries = await response.json();

        if (loading) loading.style.display = 'none';

        if (allQueueEntries.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            displayQueue(allQueueEntries);
        }

        updateQueueStatistics(allQueueEntries);
    } catch (error) {
        console.error('Error loading queue:', error);
        if (loading) loading.style.display = 'none';
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger-color);">Failed to load queue</td></tr>`;
        }
    }
}

function displayQueue(entries) {
    const tableBody = document.querySelector('#queueTable tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    entries.sort((a, b) => {
        if (a.serviceType !== b.serviceType) {
            return a.serviceType.localeCompare(b.serviceType);
        }
        return a.position - b.position;
    });

    entries.forEach((entry) => {
        const row = document.createElement('tr');
        if (entry.status === 'In Progress') {
            row.classList.add('row-in-progress');
        }

        const statusClass = getQueueStatusClass(entry.status);

        // NEW: Calculate actual remaining wait time based on elapsed time
        const joinedAt = new Date(entry.joinedAt);
        const now = new Date();
        const elapsedMinutes = Math.floor((now - joinedAt) / 60000);
        const remainingWait = Math.max(
            0,
            entry.estimatedWaitTime - elapsedMinutes,
        );

        const formattedTime = formatWaitTime(remainingWait);
        const joinedAtTime = formatJoinedTime(entry.joinedAt);

        row.innerHTML = `
            <td><strong class="position-number">#${entry.position}</strong></td>
            <td><strong>${escapeHtml(entry.studentName)}</strong></td>
            <td>${escapeHtml(entry.serviceType)}</td>
            <td>${escapeHtml(entry.contactNumber)}</td>
            <td>${formattedTime}</td>
            <td>${joinedAtTime}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(entry.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success" onclick="openQueueModal('${entry._id}')">Update</button>
                    <button class="btn btn-danger" onclick="removeFromQueue('${entry._id}')">Remove</button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function getQueueStatusClass(status) {
    const statusMap = {
        Waiting: 'status-waiting',
        'In Progress': 'status-in-progress',
        Completed: 'status-completed',
        Cancelled: 'status-cancelled',
    };
    return statusMap[status] || 'status-waiting';
}

function updateQueueStatistics(entries) {
    const waitingCount = entries.filter((e) => e.status === 'Waiting').length;
    const inProgressCount = entries.filter(
        (e) => e.status === 'In Progress',
    ).length;
    const completedCount = entries.filter(
        (e) => e.status === 'Completed',
    ).length;

    document.getElementById('totalWaiting').textContent = waitingCount;
    document.getElementById('totalInProgress').textContent = inProgressCount;
    document.getElementById('totalCompleted').textContent = completedCount;
}

function filterQueue() {
    const filterService = document.getElementById('filterService').value;
    currentQueueFilter = filterService;
    loadQueue();
}

function clearQueueFilter() {
    const filterService = document.getElementById('filterService');
    if (filterService) filterService.value = '';
    currentQueueFilter = '';
    loadQueue();
}

function openQueueModal(entryId) {
    const entry = allQueueEntries.find((e) => e._id === entryId);
    if (!entry) {
        alert('Queue entry not found');
        return;
    }

    document.getElementById('queueUpdateId').value = entry._id;
    document.getElementById('modalStudentName').textContent = entry.studentName;
    document.getElementById('modalService').textContent = entry.serviceType;
    document.getElementById('modalPosition').textContent = `#${entry.position}`;
    document.getElementById('modalContact').textContent = entry.contactNumber;
    document.getElementById('queueUpdateStatus').value = entry.status;

    const message = document.getElementById('queueUpdateMessage');
    if (message) message.style.display = 'none';

    const modal = document.getElementById('queueModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeQueueModal() {
    const modal = document.getElementById('queueModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }
    const form = document.getElementById('updateQueueForm');
    if (form) form.reset();
}

async function handleQueueUpdate(e) {
    e.preventDefault();

    const message = document.getElementById('queueUpdateMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    const entryId = document.getElementById('queueUpdateId').value;
    const updateData = {
        status: document.getElementById('queueUpdateStatus').value,
    };

    try {
        const response = await fetch(`${QUEUE_API}/${entryId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData),
        });

        if (response.ok) {
            showMessage(message, '✓ Status updated successfully!', 'success');
            setTimeout(() => {
                closeQueueModal();
                loadQueue();
            }, 1500);
        } else {
            const error = await response.json();
            showMessage(
                message,
                '✗ Failed to update: ' + (error.error || 'Unknown error'),
                'error',
            );
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage(message, '✗ Error connecting to server', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function removeFromQueue(entryId) {
    const entry = allQueueEntries.find((e) => e._id === entryId);
    if (!entry) {
        alert('Queue entry not found');
        return;
    }

    const confirmMsg = `Remove from queue?\n\nStudent: ${entry.studentName}\nService: ${entry.serviceType}\nPosition: #${entry.position}`;

    if (!confirm(confirmMsg)) return;

    try {
        const response = await fetch(`${QUEUE_API}/${entryId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            alert('✓ Removed from queue successfully');
            loadQueue();
        } else {
            alert('✗ Failed to remove from queue');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('✗ Error connecting to server');
    }
}

// ==================== UTILITY FUNCTIONS ====================

function showMessage(element, text, type) {
    if (!element) return;
    element.textContent = text;
    element.className = 'message ' + type;
    element.style.display = 'block';
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function formatWaitTime(minutes) {
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
}

function formatJoinedTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;

    return date.toLocaleString('en-AU', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

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
