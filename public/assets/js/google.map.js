// Función que inicializa el mapa
    function initMap() {
        // Crea un objeto de mapa centrado en las coordenadas de tu ubicación
        var ubicacion = { lat: -34.547334, lng: -58.515616 };

        // Inicializa el mapa
        var map = new google.maps.Map(document.getElementById('mapid'), {
            zoom: 13,
            center: ubicacion
        });

        // Coloca un marcador en la ubicación
        var marker = new google.maps.Marker({
            position: ubicacion,
            map: map,
            title: 'BetoStore'
        });
    }