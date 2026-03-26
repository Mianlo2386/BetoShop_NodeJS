document.addEventListener('DOMContentLoaded', function () {
  setTimeout(function () {
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    const toastList = toastElList.map(function (toastEl) {
      return new bootstrap.Toast(toastEl);
    });
    toastList.forEach(toast => toast.show());
  }, 100); // pequeño delay para asegurar render completo
});