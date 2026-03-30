const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        console.log('Form submit intercepted');
        
        const modal = new bootstrap.Modal(document.getElementById('contactMessageModal'));
        const messageBody = document.getElementById('contactMessageBody');

        messageBody.innerHTML = 'Enviando...';
        modal.show();

        const formData = new FormData(contactForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        console.log('Sending data:', data);

        fetch('https://betostore-backend.onrender.com/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.success) {
                messageBody.innerHTML = '¡Gracias! Hemos enviado una confirmación a tu correo.';
                contactForm.reset();
            } else {
                messageBody.innerHTML = data.error || 'Error al enviar el mensaje, por favor intenta de nuevo.';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            messageBody.innerHTML = 'Error al enviar el mensaje, por favor intenta de nuevo.';
        });
    });
}
