const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const modal = new bootstrap.Modal(document.getElementById('contactMessageModal'));
        const messageBody = document.getElementById('contactMessageBody');
        messageBody.innerHTML = 'Enviando...';
        modal.show();

        const formData = new FormData(contactForm);
        const data = {
            nombre: formData.get('name'),
            email: formData.get('email'),
            telefono: formData.get('phone') || '',
            asunto: formData.get('subject'),
            mensaje: formData.get('message')
        };

        fetch('/api/contactos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                messageBody.innerHTML = 'Hemos recibido tu mensaje. Nos contactaremos a la brevedad.';
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
