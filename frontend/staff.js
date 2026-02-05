const APPOINTMENTS_API = 'http://localhost:8080/api/appointments';
const QUEUE_API = 'http://localhost:8080/api/queue';

let allAppointments = [];
let allQueueEntries = [];
let currentQueueFilter = '';
let queueAutoRefreshInterval = null; // NEW: Auto-refresh interval

// ==================== INITIALIZATION ====================

window.onload = () => {
    console.log('QueueLess Campus - Staff Dashboard loaded');

    // Load appointments by default
    loadAppointments();
    setupEventListeners();
    initializeAnimations();
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

// ==========================
// ANIMATIONS - Page Load
// ==========================
function initializeAnimations() {
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe dashboard sections
    document.querySelectorAll('.dashboard-header, .tab-container, .tab-content, .stats-container, .filter-section').forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(element);
    });

    // Animate buttons on hover
    const buttons = document.querySelectorAll('button, .btn, .tab-button');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '';
        });
    });

    // Set active nav
    setActiveNav();
}

// Add active class to current nav item
function setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// ==================== TAB SWITCHING ====================

function switchTab(tabName) {
    // Update tab buttons
    const tabs = document.querySelectorAll('.tab-button');
    tabs.forEach((tab) => tab.classList.remove('active'));

    // Update sections with animation
    const sections = document.querySelectorAll('.tab-content');
    sections.forEach((section) => {
        if (section.classList.contains('active')) {
            section.style.opacity = '1';
            setTimeout(() => {
                section.style.opacity = '0';
                setTimeout(() => {
                    section.classList.remove('active');
                }, 300);
            }, 0);
        }
    });

    if (tabName === 'appointments') {
        document.getElementById('appointmentsTab').classList.add('active');
        setTimeout(() => {
            const appointmentsSection = document.getElementById('appointmentsSection');
            appointmentsSection.classList.add('active');
            appointmentsSection.style.opacity = '0';
            setTimeout(() => {
                appointmentsSection.style.opacity = '1';
                appointmentsSection.style.transition = 'opacity 0.3s ease';
            }, 50);
        }, 300);
        loadAppointments();

        // NEW: Stop queue auto-refresh when switching to appointments
        stopQueueAutoRefresh();
    } else if (tabName === 'queue') {
        document.getElementById('queueTab').classList.add('active');
        setTimeout(() => {
            const queueSection = document.getElementById('queueSection');
            queueSection.classList.add('active');
            queueSection.style.opacity = '0';
            setTimeout(() => {
                queueSection.style.opacity = '1';
                queueSection.style.transition = 'opacity 0.3s ease';
            }, 50);
        }, 300);
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

    appointments.forEach((app, index) => {
        const row = document.createElement('tr');
        const statusClass = getAppointmentStatusClass(app.status);
        const formattedDate = formatDate(app.appointmentDate);
        const formattedTime = formatTime(app.appointmentTime);

        // Animation: Stagger table rows
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';

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

        // Trigger animation
        setTimeout(() => {
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
            row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        }, 50 * index);
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

        // Animation: Fade in modal
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transition = 'opacity 0.3s ease';
        }, 10);
    }
}

function closeAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.style.opacity = '1';
        setTimeout(() => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }, 300);
        }, 0);
    }
    const form = document.getElementById('updateAppointmentForm');
    if (form) form.reset();
}

async function handleAppointmentUpdate(e) {
    e.preventDefault();

    const message = document.getElementById('appointmentUpdateMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // Button click animation
    submitBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        submitBtn.style.transform = 'scale(1)';
    }, 200);

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

    entries.forEach((entry, index) => {
        const row = document.createElement('tr');
        if (entry.status === 'In Progress') {
            row.classList.add('row-in-progress');
        }

        // Animation: Stagger table rows
        row.style.opacity = '0';
        row.style.transform = 'translateX(-20px)';

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

        // Trigger animation
        setTimeout(() => {
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
            row.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        }, 50 * index);
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

    // Animate stat counters
    animateStatCounter('totalWaiting', waitingCount);
    animateStatCounter('totalInProgress', inProgressCount);
    animateStatCounter('totalCompleted', completedCount);
}

// Animate stat counters
function animateStatCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const currentValue = parseInt(element.textContent) || 0;
    const increment = (targetValue - currentValue) / 20;
    let current = currentValue;

    const updateCounter = () => {
        current += increment;
        if ((increment > 0 && current < targetValue) || (increment < 0 && current > targetValue)) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = targetValue;
        }
    };

    if (currentValue !== targetValue) {
        updateCounter();
    }
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

        // Animation: Fade in modal
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transition = 'opacity 0.3s ease';
        }, 10);
    }
}

function closeQueueModal() {
    const modal = document.getElementById('queueModal');
    if (modal) {
        modal.style.opacity = '1';
        setTimeout(() => {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.classList.remove('active');
                modal.style.display = 'none';
            }, 300);
        }, 0);
    }
    const form = document.getElementById('updateQueueForm');
    if (form) form.reset();
}

async function handleQueueUpdate(e) {
    e.preventDefault();

    const message = document.getElementById('queueUpdateMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    // Button click animation
    submitBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        submitBtn.style.transform = 'scale(1)';
    }, 200);

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

    // Animation: Fade in
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px)';
    element.style.display = 'block';

    setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        element.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    }, 10);
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