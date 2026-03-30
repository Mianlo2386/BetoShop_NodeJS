document.addEventListener("DOMContentLoaded", function () {
    const logoutIcon = document.getElementById("logout-icon");
    if (logoutIcon) {
        logoutIcon.addEventListener("click", function (e) {
            e.preventDefault();
            Swal.fire({
                title: '¿Cerrar sesión?',


                html: `
                    <div class="text-success mb-2" style="font-size: 3rem;">
                        <i class="bi bi-exclamation-circle-fill"></i>
                    </div>
                    <p class="mt-2">Tu sesión se cerrará y volverás al inicio.</p>
                `,
                showCancelButton: true,
                confirmButtonColor: '#198754',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, cerrar sesión',
                cancelButtonText: 'Cancelar',
                customClass: {
                    popup: 'shadow rounded',
                    confirmButton: 'btn btn-success',
                    cancelButton: 'btn btn-secondary'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "/logout";
                }
            });
        });
    }
});