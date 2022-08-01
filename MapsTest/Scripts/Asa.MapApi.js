// https://developers.arcgis.com/javascript/3/jsapi/
var mapApp = {
    map : undefined
}

mapApp.getPOIs = function (callback) {
    $.get("../api/pois", function (data) {
        console.log(data)
        if (callback) callback(data.pois);
    });
}


mapApp.initMap = function (callback) {
    mapApp.map;

    require(["esri/map", "esri/symbols/SimpleMarkerSymbol",  "esri/layers/GraphicsLayer", "dojo/domReady!"],
        function (Map, SimpleMarkerSymbol, GraphicsLayer) {
        mapApp.map = new Map("map", {
            basemap: "topo",  //For full list of pre-defined basemaps, navigate to http://arcg.is/1JVo6Wd
            center: [-58.3724715, -34.595986], // longitude, latitude
            zoom: 13
        });

        mapApp.POIsLayer = new GraphicsLayer({ id: "circles" });
        mapApp.map.addLayer(mapApp.POIsLayer);
        mapApp.POIsSymbol = new SimpleMarkerSymbol({
                "color": [0, 128, 0, 100],
                "size": 10,
                "angle": -30,
                "xoffset": 0,
                "yoffset": 0,
                "type": "esriSMS",
                "style": "esriSMSSquare",
                "outline": {
                    "color": [168, 0, 0, 255],
                    "width": 1,
                    "type": "esriSLS",
                    "style": "esriSLSSolid"
                }
            });
        
        if (callback) callback();
    });
}

mapApp.initMap(function () {
    mapApp.getPOIs(function (pois) {
        //console.log(pois);
        require(["esri/graphic", "esri/geometry/Point", "esri/geometry/webMercatorUtils", "dojo/domReady!"],
            function (Graphic, Point, webMercatorUtils) {
                pois.forEach(function (poiData) {
                    var coors = webMercatorUtils.lngLatToXY(poiData.XLon, poiData.YLat,)
                    var poi = new Point(coors[0], coors[1], mapApp.map.spatialReference)
                    mapApp.POIsLayer.add(new Graphic(poi, mapApp.POIsSymbol, poiData));
                })
                
            });
    });
});

function ValidacionesPOI() {
    var nombre = document.getElementById('Txt_Nombre');
    var direccion = document.getElementById('Txt_Direccion');
    var nroTelefono = document.getElementById('Lng_NroTelefono');
    var coordenadas = document.getElementById('Txt_Coordenadas');
    var categoria = document.getElementById('Cbo_Categorias');

    var regNombre = /\d+$/g;
    var regNroTelefono = /^(?:(?:00)?549?)?0?(?:11|[2368]\d)(?:(?=\d{0,2}15)\d{2})??\d{8}$/;

    var error = document.querySelector('#Txt_Nombre + span.error');
    error.textContent = "";

    if (nombre.value == "" || regNombre.test(nombre.value)) {
        error.textContent = "Por favor ingrese un nombre válido.";
        nombre.focus();
        return false;
    }

    var error = document.querySelector('#Txt_Direccion + span.error');
    error.textContent = "";

    if (direccion.value == "") {
        error.textContent = "Por favor ingrese una dirección.";
        direccion.focus();
        return false;
    }

    var error = document.querySelector('#Lng_NroTelefono + span.error');
    error.textContent = "";

    if (nroTelefono.value == "" || !regNroTelefono.test(nroTelefono.value)) {
        error.textContent = "Por favor ingrese un Nro de teléfono válido.";
        nroTelefono.focus();
        return false;
    }

    var error = document.querySelector('#Txt_Coordenadas + span.error');
    error.textContent = "";

    if (coordenadas.value == "") {
        document.forms.PuntoDeInteres.Error.value = "Por favor ingrese las coordenadas.";
        coordenadas.focus();
        return false;
    }
    //Valido que se haya ingresado una coordenada antes de la coma

    if (coordenadas.value.indexOf(',') <= 0) {
        document.forms.PuntoDeInteres.Error.value = "Por favor ingrese las coordenadas.";
        coordenadas.focus();
        return false;
    }
    const listacoordenadas = coordenadas.value.split(',');

    if (listacoordenadas.length != 2) {
        error.textContent = "Por favor ingrese 2 coordenadas separadas por una ',' (coma).";
        coordenadas.focus();
        return false;
    }

    if (listacoordenadas[1] == "") {
        error.textContent = "Por favor ingrese la coordenada Y.";
        coordenadas.focus();
        return false;
    }

    if (isNaN(listacoordenadas[0]) || isNaN(listacoordenadas[1])) {
        error.textContent = "Por favor ingrese coordenadas numéricas.";
        coordenadas.focus();
        return false;
    }

    if (listacoordenadas[0] < -180 || listacoordenadas[0] > 180) {
        error.textContent = "Por favor ingrese un valor entre -180 y 180 para la coordenada X.";
        coordenadas.focus();
        return false;
    }

    if (listacoordenadas[1] < -90 || listacoordenadas[1] > 90) {
        error.textContent = "Por favor ingrese un valor entre -90 y 90 para la coordenada Y.";
        coordenadas.focus();
        return false;
    }

    var error = document.querySelector('#Cbo_Categorias + span.error');
    error.textContent = "";

    if (categoria.value == "") {
        error.textContent = "Por favor seleccione una categoría.";
        categoria.focus();
        return false;
    }

    return true ;
}