document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("inputMobileSearch");
    const searchButton = document.querySelector(".fa-search");

    function performSearch() {
        let query = searchInput.value.trim();
        if (query) {
            // Redirigir a /shop con el parámetro query
            window.location.href = `/shop?query=${encodeURIComponent(query)}`;
        }
    }

    searchInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            performSearch();
        }
    });

    searchButton.addEventListener("click", function () {
        performSearch();
    });
});