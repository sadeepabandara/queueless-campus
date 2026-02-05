// appointment.js - Handles appointment booking functionality securely

// ==========================
// Security: Role-based Access Control
// ==========================
const role = localStorage.getItem("userRole");
if (!role || role !== "student") {
  alert("Unauthorized access! Students only.");
  window.location.replace("login.html");
}

// ==========================
// Configuration
// ==========================
const API_URL = 'http://localhost:5001/api/appointments';
const form = document.getElementById('appointmentForm');
const message = document.getElementById('message');

// ==========================
// Security: XSS Sanitization
// ==========================
function sanitize(input) {
  return input.replace(/[<>]/g, "");
}

// ==========================
// Security: Prevent Logic Abuse (No past dates)
// ==========================
const dateInput = document.getElementById('appointmentDate');
if (dateInput) {
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);
}

// ==========================
// Form Submission Handler
// ==========================
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;

  // Security: Prevent multiple submissions (Race condition control)
  submitBtn.textContent = 'Booking...';
  submitBtn.disabled = true;

  // ==========================
  // Collect & Sanitize Inputs
  // ==========================
  const data = {
    studentName: sanitize(document.getElementById('studentName').value.trim()),
    serviceType: sanitize(document.getElementById('serviceType').value),
    appointmentDate: document.getElementById('appointmentDate').value,
    appointmentTime: document.getElementById('appointmentTime').value,
    status: 'Booked',
  };

  // ==========================
  // Security: Client-side Validation
  // ==========================
  if (!data.studentName || !data.serviceType || !data.appointmentDate || !data.appointmentTime) {
    showMessage('✗ Please fill all required fields correctly.', 'error');
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
    return;
  }

  // ==========================
  // Security: CSRF Awareness (Frontend token)
  // ==========================
  const csrfToken = document.getElementById("csrfToken")?.value || "secure-token-placeholder";

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken // Security: CSRF-aware request
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
        'success'
      );
      form.reset();
      message.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      const error = await response.json();
      showMessage(
        '✗ Failed to book appointment: ' +
          (error.error || 'Unknown error'),
        'error'
      );
    }
  } catch (error) {
    console.error('Error:', error);
    showMessage(
      '✗ Error connecting to server. Please try again later.',
      'error'
    );
  } finally {
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// ==========================
// UI Message Handler
// ==========================
function showMessage(text, type) {
  message.textContent = text;
  message.className = 'message ' + type;
  message.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    message.style.display = 'none';
  }, 5000);
}

// ==========================
// Utility Functions
// ==========================
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