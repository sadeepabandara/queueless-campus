// appointment.js - Handles appointment booking functionality securely

// ==========================

// Security: Role-based Access Control

// ==========================

// const role = localStorage.getItem('userRole');

// if (!role || role !== 'student') {

//     alert('Unauthorized access! Students only.');

//     window.location.replace('login.html');

// }

// ==========================

// Configuration

// ==========================

const API_URL = 'http://localhost:8080/api/appointments';

const form = document.getElementById('appointmentForm');

const message = document.getElementById('message');

// ==========================

// ANIMATIONS - Page Load

// ==========================

document.addEventListener('DOMContentLoaded', () => {

    console.log('QueueLess Campus - Appointment page loaded');

    // Add smooth scrolling for all anchor links

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

    // Add animation to form container on load

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

    // Observe form container and form groups

    document.querySelectorAll('.form-container, .appointment-form, .form-group, .booking-form').forEach(element => {

        element.style.opacity = '0';

        element.style.transform = 'translateY(20px)';

        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

        observer.observe(element);

    });

    // Add focus animation to form inputs

    const formInputs = document.querySelectorAll('input, select, textarea');

    formInputs.forEach(input => {

        input.addEventListener('focus', function () {

            this.parentElement.style.transform = 'scale(1.02)';

            this.parentElement.style.transition = 'transform 0.3s ease';

        });

        input.addEventListener('blur', function () {

            this.parentElement.style.transform = 'scale(1)';

        });

    });

    // Animate submit button on hover

    const submitButtons = document.querySelectorAll('button[type="submit"], .submit-btn, .btn-primary');

    submitButtons.forEach(button => {

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

});

// ==========================

// Security: XSS Sanitization

// ==========================

function sanitize(input) {

    return input.replace(/[<>]/g, '');

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

    // Show loading state

    const submitBtn = form.querySelector('button[type="submit"]');

    const originalText = submitBtn.textContent;

    // Animation: Button click effect

    submitBtn.style.transform = 'scale(0.95)';

    setTimeout(() => {

        submitBtn.style.transform = 'scale(1)';

    }, 200);

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

// ==========================

// UI Message Handler (with animation)

// ==========================

function showMessage(text, type) {

    message.textContent = text;

    message.className = 'message ' + type;

    // Animation: Fade in and slide down

    message.style.opacity = '0';

    message.style.transform = 'translateY(-20px)';

    message.style.display = 'block';

    setTimeout(() => {

        message.style.opacity = '1';

        message.style.transform = 'translateY(0)';

        message.style.transition = 'opacity 0.5s ease, transform 0.5s ease';

    }, 10);

    // Auto-hide after 5 seconds

    setTimeout(() => {

        message.style.opacity = '0';

        message.style.transform = 'translateY(-20px)';

        setTimeout(() => {

            message.style.display = 'none';

        }, 500);

    }, 5000);

}

// ==========================

// Add active class to current nav item

// ==========================

function setActiveNav() {

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-menu a').forEach(link => {

        if (link.getAttribute('href') === currentPage) {

            link.classList.add('active');

        }

    });

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
