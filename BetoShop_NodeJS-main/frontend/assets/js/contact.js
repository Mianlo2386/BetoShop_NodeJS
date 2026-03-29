const contactForm = document.querySelector('form[action="/contact"]');

contactForm.addEventListener('submit', function (e) {
    e.preventDefault(); // Evitamos que envíe directamente
    const modal = new bootstrap.Modal(document.getElementById('contactMessageModal'));
    const messageBody = document.getElementById('contactMessageBody');

    // Mostramos "Enviando..."
    messageBody.innerHTML = 'Enviando...';
    modal.show();

    // Enviar formulario manualmente
    fetch('/contact', {
        method: 'POST',
        body: new FormData(contactForm)
    })
    .then(response => {
        if (response.ok) {
            messageBody.innerHTML = '¡Gracias! Hemos enviado una confirmación a tu correo.';
            contactForm.reset(); // Limpiar formulario
        } else {
            messageBody.innerHTML = 'Error al enviar el mensaje, por favor intenta de nuevo.';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        messageBody.innerHTML = 'Error al enviar el mensaje, por favor intenta de nuevo.';
    });
});