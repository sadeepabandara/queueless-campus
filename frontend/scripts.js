const form = document.getElementById('appointmentForm');
const message = document.getElementById('message');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        studentName: document.getElementById('studentName').value,
        serviceType: document.getElementById('serviceType').value,
        appointmentDate: document.getElementById('appointmentDate').value,
        appointmentTime: document.getElementById('appointmentTime').value,
    };

    try {
        const response = await fetch('http://localhost:8080/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            message.textContent = 'Appointment booked successfully!';
            message.style.color = 'green';
            form.reset();
        } else {
            message.textContent = 'Failed to book appointment.';
            message.style.color = 'red';
        }
    } catch (error) {
        message.textContent = 'Error connecting to server.';
        message.style.color = 'red';
    }
});
