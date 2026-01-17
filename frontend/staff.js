const API_URL = 'http://localhost:8080/api/appointments';
let allAppointments = [];

// Load appointments when page loads
window.onload = () => {
    loadAppointments();
    setupEventListeners();
};

function setupEventListeners() {
    // Set today's date as default filter
    const filterDate = document.getElementById('filterDate');
    if (filterDate) {
        const today = new Date().toISOString().split('T')[0];
        filterDate.value = today;
    }

    // Update form submission
    const updateForm = document.getElementById('updateForm');
    if (updateForm) {
        updateForm.addEventListener('submit', handleUpdate);
    }

    // Close modal when clicking outside
    const modal = document.getElementById('updateModal');
    window.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };
}

async function loadAppointments() {
    const tableBody = document.querySelector('#appointmentsTable tbody');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');

    // Show loading
    if (loading) loading.style.display = 'block';
    if (tableBody) tableBody.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';

    try {
        const response = await fetch(API_URL);
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
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--danger-color);">
                        Failed to load appointments. Please try again.
                    </td>
                </tr>
            `;
        }
    }
}

function displayAppointments(appointments) {
    const tableBody = document.querySelector('#appointmentsTable tbody');
    const emptyState = document.getElementById('emptyState');

    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (appointments.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    appointments.forEach((app) => {
        const row = document.createElement('tr');

        const statusClass = getStatusClass(app.status);
        const formattedDate = formatDate(app.appointmentDate);
        const formattedTime = formatTime(app.appointmentTime);

        row.innerHTML = `
            <td><strong>${escapeHtml(app.studentName)}</strong></td>
            <td>${escapeHtml(app.serviceType)}</td>
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(
            app.status
        )}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-success" onclick="openUpdateModal('${
                        app._id
                    }')">
                        Update
                    </button>
                    <button class="btn btn-danger" onclick="deleteAppointment('${
                        app._id
                    }')">
                        Delete
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

function getStatusClass(status) {
    const statusMap = {
        Booked: 'status-booked',
        Confirmed: 'status-confirmed',
        Completed: 'status-completed',
        Cancelled: 'status-cancelled',
        'No-Show': 'status-no-show',
    };
    return statusMap[status] || 'status-booked';
}

function filterByDate() {
    const filterDate = document.getElementById('filterDate').value;

    if (!filterDate) {
        displayAppointments(allAppointments);
        return;
    }

    const filtered = allAppointments.filter(
        (app) => app.appointmentDate === filterDate
    );
    displayAppointments(filtered);
}

function clearFilter() {
    const filterDate = document.getElementById('filterDate');
    if (filterDate) filterDate.value = '';
    displayAppointments(allAppointments);
}

function openUpdateModal(appointmentId) {
    const appointment = allAppointments.find(
        (app) => app._id === appointmentId
    );

    if (!appointment) {
        alert('Appointment not found');
        return;
    }

    // Populate form
    document.getElementById('updateId').value = appointment._id;
    document.getElementById('updateStatus').value = appointment.status;
    document.getElementById('updateDate').value = appointment.appointmentDate;
    document.getElementById('updateTime').value = appointment.appointmentTime;

    // Clear previous messages
    const updateMessage = document.getElementById('updateMessage');
    if (updateMessage) {
        updateMessage.style.display = 'none';
    }

    // Show modal
    const modal = document.getElementById('updateModal');
    if (modal) {
        modal.classList.add('active');
        modal.style.display = 'flex';
    }
}

function closeModal() {
    const modal = document.getElementById('updateModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
    }

    // Reset form
    const updateForm = document.getElementById('updateForm');
    if (updateForm) updateForm.reset();
}

async function handleUpdate(e) {
    e.preventDefault();

    const updateMessage = document.getElementById('updateMessage');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    const appointmentId = document.getElementById('updateId').value;
    const updateData = {
        status: document.getElementById('updateStatus').value,
        appointmentDate: document.getElementById('updateDate').value,
        appointmentTime: document.getElementById('updateTime').value,
    };

    try {
        const response = await fetch(`${API_URL}/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (response.ok) {
            showUpdateMessage('✓ Appointment updated successfully!', 'success');

            setTimeout(() => {
                closeModal();
                loadAppointments();
            }, 1500);
        } else {
            const error = await response.json();
            showUpdateMessage(
                '✗ Failed to update: ' + (error.error || 'Unknown error'),
                'error'
            );
        }
    } catch (error) {
        console.error('Error updating appointment:', error);
        showUpdateMessage('✗ Error connecting to server', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function deleteAppointment(appointmentId) {
    const appointment = allAppointments.find(
        (app) => app._id === appointmentId
    );

    if (!appointment) {
        alert('Appointment not found');
        return;
    }

    const confirmMsg = `Are you sure you want to delete this appointment?\n\nStudent: ${
        appointment.studentName
    }\nService: ${appointment.serviceType}\nDate: ${formatDate(
        appointment.appointmentDate
    )}`;

    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${appointmentId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            alert('✓ Appointment deleted successfully');
            loadAppointments();
        } else {
            const error = await response.json();
            alert('✗ Failed to delete: ' + (error.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('✗ Error connecting to server');
    }
}

function showUpdateMessage(text, type) {
    const updateMessage = document.getElementById('updateMessage');
    if (!updateMessage) return;

    updateMessage.textContent = text;
    updateMessage.className = 'message ' + type;
    updateMessage.style.display = 'block';
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
