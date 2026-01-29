// appointment.js - Handles appointment booking functionality
const API_URL = 'http://localhost:8080/api/appointments';

const form = document.getElementById('appointmentForm');
const message = document.getElementById('message');

// Set minimum date to today
const dateInput = document.getElementById('appointmentDate');
if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Booking...';
    submitBtn.disabled = true;

    const data = {
        studentName: document.getElementById('studentName').value.trim(),
        serviceType: document.getElementById('serviceType').value,
        appointmentDate: document.getElementById('appointmentDate').value,
        appointmentTime: document.getElementById('appointmentTime').value,
        notes: document.getElementById('notes').value.trim(),
        status: 'Booked',
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
            showMessage(
                "✓ Appointment booked successfully! We'll see you on " +
                    formatDate(data.appointmentDate) +
                    ' at ' +
                    formatTime(data.appointmentTime),
                'success',
            );
            form.reset();

            // Scroll to message
            message.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            const error = await response.json();
            showMessage(
                '✗ Failed to book appointment: ' +
                    (error.error || 'Unknown error'),
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

function showMessage(text, type) {
    message.textContent = text;
    message.className = 'message ' + type;
    message.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        message.style.display = 'none';
    }, 5000);
}

function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatTime(timeStr) {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}
