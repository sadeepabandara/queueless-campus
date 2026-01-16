const form = document.getElementById('appointmentForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const appointment = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        service: document.getElementById('service').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
    };

    try {
        const response = await fetch('http://localhost:8080/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointment),
        });

        if (response.ok) {
            message.style.color = 'green';
            message.textContent = 'Appointment booked successfully!';
            form.reset();
        } else {
            message.style.color = 'red';
            message.textContent = 'Failed to book appointment.';
        }
    } catch (error) {
        message.style.color = 'red';
        message.textContent = 'Server error. Please try again.';
    }
});
