// https://developers.arcgis.com/javascript/3/jsapi/
var mapApp = {
    map : undefined
}

function CargarPOIs(callback) {
    $.get("../api/pois", function (data) {
        console.log(data)
        if (callback) callback(data.pois);
    });
}

mapApp.initMap = function (callback) {
    mapApp.map;
    require(["esri/map", "esri/symbols/SimpleMarkerSymbol", "esri/layers/GraphicsLayer", "dojo/domReady!"],
        function (Map, SimpleMarkerSymbol, GraphicsLayer) {
        mapApp.map = new Map("map", {
            basemap: "topo",  //For full list of pre-defined basemaps, navigate to http://arcg.is/1JVo6Wd
            center: [-58.3724715, -34.595986], // longitude, latitude
            zoom: 13
        });

        mapApp.POIsLayer = new GraphicsLayer({ id: "circles" });
        mapApp.map.addLayer(mapApp.POIsLayer);
        //Tuve que poner un delay ya que de lo contrario no cargaba los POIs. 
        var i = 0
        while (i <= 350000000) {
            i++
        }
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
    //mapApp.getPOIs(function (pois) {
    CargarPOIs(function (pois) {
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

function IndicarPOI(event) {
    var coordenadas = event.latlng.toString();
    coordenadas = coordenadas.substr(0, coordenadas.length - 1);
    coordenadas = coordenadas.split(",");
    //document.getElementById("coord").value = coord[0] + "," + coord[1];
};


/*Cargo el combo Categorías para el Form Modal de Alta de POI*/
$('#formModal').on('show.bs.modal', function (e) {
    CargarCategorias("#Cbo_Categorias");
    SeteoSoloLecturaModal(false);
});

/*Cargo los combos de POIs y Categorías para el Form Modal de Modificación y Eliminación de POIs*/
$('#listModal').on('show.bs.modal', function (e) {
    InicioVariablesListModal();
});

function InicioVariablesListModal() {
    CargarCategorias("#Cbo_CategoriasList");

    var filaBotones = document.getElementById('FilaBotones');
    filaBotones.style.display = "none";
    var cuerpoPOI = document.getElementById('CuerpoPOI');
    cuerpoPOI.style.display = "none";
    var divBotonesList = document.getElementById('divBotonesList');
    divBotonesList.style.display = "none";
    var seleccionPOI = document.getElementById('SeleccionPOI');
    seleccionPOI.style.display = "block";

    var comboPOIs = document.getElementById('Cbo_Pois');
    comboPOIs.textContent = '';

    let nuevaOpcion = document.createElement("option");
    nuevaOpcion.value = "";
    nuevaOpcion.text = "Seleccione un punto de interés.";
    nuevaOpcion.disabled = true;
    nuevaOpcion.selected = true;
    comboPOIs.add(nuevaOpcion);

    CargarPOIs(function (pois) {
        pois.forEach(function (poiData) {
            let nuevaOpcion = document.createElement("option");
            nuevaOpcion.value = poiData.Id;
            nuevaOpcion.text = poiData.Name;
            comboPOIs.add(nuevaOpcion);
        })
    });
}

function SeteoSoloLecturaModal(sololectura) {
    
    var div_Botones= document.getElementById('div_Botones');
    if (sololectura == false) {
        div_Botones.style.display = "block";
        document.getElementById('Txt_Nombre').removeAttribute("readonly");
        document.getElementById('Txt_Direccion').removeAttribute("readonly");
        document.getElementById('Lng_NroTelefono').removeAttribute("readonly");
        document.getElementById('Txt_Coordenadas').removeAttribute("readonly");
        document.getElementById('Cbo_Categorias').removeAttribute("disabled");
    }
    else {
        div_Botones.style.display = "none";
        document.getElementById('Txt_Nombre').setAttribute("readonly", sololectura);
        document.getElementById('Txt_Direccion').setAttribute("readonly", sololectura);
        document.getElementById('Lng_NroTelefono').setAttribute("readonly", sololectura);
        document.getElementById('Txt_Coordenadas').setAttribute("readonly", sololectura);
        document.getElementById('Cbo_Categorias').setAttribute("disabled", sololectura);
    }
}

function CargarCategorias(combo) {
    fetch('../api/Categories', {
        method: "GET",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
    })
        .then(function (response) {
            return response.json();
        }).then(function (data) {
            var comboCategorias = document.querySelector(combo);
            for (let categoria of data.categories) {
                let nuevaOpcion = document.createElement("option");
                nuevaOpcion.value = categoria.Id;
                nuevaOpcion.text = categoria.Value;
                comboCategorias.add(nuevaOpcion);
            };

        }).catch(function (e) {
            console.error(e)
        });
}

function SelecciondDePOI() {
    var filaMensaje = document.getElementById('FilaMensaje');
    filaMensaje.style.display = "none";

    var comboPois = document.getElementById('Cbo_Pois');

    if (comboPois.value == "") {
        error.textContent = "Por favor seleccione un punto de interés.";
        comboPois.focus();
        return;
    }
    //Muestro los botones para seleccionar si lo desea dar de baja o modificar.
    var filaBotones = document.getElementById('FilaBotones');
    filaBotones.style.display = "block";
}

function ValidacionesPOI(p_nombre, p_direccion, p_nroTelefono, p_coordenadas, p_categoria, p_altamodificacion) {

    var errorElement = '';
    if (p_altamodificacion == 'M') {
        errorElement = 'List'
    }

    var regNombre = /\d+$/g;
    var regNroTelefono = /^(?:(?:00)?549?)?0?(?:11|[2368]\d)(?:(?=\d{0,2}15)\d{2})??\d{8}$/;

    var error = document.getElementById('SpanTxt_Nombre' + errorElement);
    error.textContent = "";

    if (p_nombre.value == "" || regNombre.test(p_nombre.value)) {
        error.textContent = "Por favor ingrese un nombre válido. No se permite ingresar números.";
        p_nombre.focus();
        return false;
    }

    var error = document.getElementById('SpanTxt_Direccion' + errorElement);
    error.textContent = "";

    if (p_direccion.value == "") {
        error.textContent = "Por favor ingrese una dirección.";
        p_direccion.focus();
        return false;
    }

    var error = document.getElementById('SpanLng_NroTelefono' + errorElement);
    error.textContent = "";

    if (p_nroTelefono.value == "" || !regNroTelefono.test(p_nroTelefono.value)) {
        error.textContent = "Por favor ingrese un Nro de teléfono válido.";
        p_nroTelefono.focus();
        return false;
    }

    var error = document.getElementById('SpanTxt_Coordenadas' + errorElement);
    error.textContent = "";

    if (p_coordenadas.value == "") {
        error.textContent = "Por favor ingrese las coordenadas separadas por una coma. Ej: -34.595986,-58.3724715";
        p_coordenadas.focus();
        return false;
    }
    //Valido que se haya ingresado una coordenada antes de la coma

    if (p_coordenadas.value.indexOf(',') <= 0) {
        error.textContent = "Por favor ingrese las coordenadas separadas por una coma. Ej: -34.595986,-58.3724715";
        p_coordenadas.focus();
        return false;
    }
    var listacoordenadas = p_coordenadas.value.split(',');

    if (listacoordenadas.length != 2) {
        error.textContent = "Por favor ingrese 2 coordenadas separadas por una ',' (coma).";
        p_coordenadas.focus();
        return false;
    }

    if (listacoordenadas[1] == "") {
        error.textContent = "Por favor ingrese la coordenada Y.";
        p_coordenadas.focus();
        return false;
    }

    if (isNaN(listacoordenadas[0]) || isNaN(listacoordenadas[1]) || listacoordenadas[0] < -180 || listacoordenadas[0] > 180 || listacoordenadas[1] < -90 || listacoordenadas[1] > 90) {
        error.textContent = "Por favor ingrese coordenadas numéricas. Entre -180 y 180 para X y -90 y 90 para Y";
        p_coordenadas.focus();
        return false;
    }

    var error = document.getElementById('SpanCbo_Categorias' + errorElement);
    error.textContent = "";

    if (p_categoria.value == "") {
        error.textContent = "Por favor seleccione una categoría.";
        p_categoria.focus();
        return false;
    }

    return true;
}

$('#Btn_BorrarPOI').on('click', function (event) {
    var comboPois = document.getElementById('Cbo_Pois');

    var datos = JSON.stringify({
        "entity": {
            "Id": comboPois.value
        }
    });

    fetch('../api/POIs', {
        method: "DELETE",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: datos,
    }).then(function (response) {
        return response.json();
    }).then(function (resultado) {
        if (resultado.isvalid == true) {
            MostrarMensajeError('Se ha borrado el Punto de Interés seleccionado.', 'M')
            var filaBotones = document.getElementById('FilaBotones');
            filaBotones.style.display = "none";
            var comboPOIs = document.getElementById('Cbo_Pois');
            comboPOIs.textContent='';
            InicioVariablesListModal();
        }
        else {
            MostrarMensajeError(data.mensajeerror, 'M');
        }
    }).catch(function (e) {
        console.error(e)
    });
})

function MostrarMensajeError(mensaje, altamodificacion) {
    var filaMensaje = document.getElementById('FilaMensaje');
    var txtError = document.getElementById('Txt_error');

    if (altamodificacion == 'M') {
        filaMensaje = document.getElementById('FilaMensajeList');
        txtError = document.getElementById('Txt_errorList');

    }

    filaMensaje.style.display = "block";
    txtError.value = mensaje;
}

$('#Btn_CancelarList').on('click', function (event) {
    var listModal = document.getElementById('listModal');
    listModal.style.display = "none";

    var comboPOIs = document.getElementById('Cbo_Pois');
    comboPOIs.textContent = '';

    var tablaSeleccion = document.getElementById('SeleccionPOI');
    tablaSeleccion.style.display = "block";

    var tablaCuerpo = document.getElementById('CuerpoPOI');
    tablaCuerpo.style.display = "none";

    var divBotonesList = document.getElementById('divBotonesList');
    divBotonesList.style.display = "none";

    var nombre = document.getElementById('Txt_NombreList');
    var direccion = document.getElementById('Txt_DireccionList');
    var nroTelefono = document.getElementById('Lng_NroTelefonoList');
    var coordenadas = document.getElementById('Txt_CoordenadasList');
    var categoria = document.getElementById('Cbo_CategoriasList');

    nombre.value = '';
    direccion.value = '';
    nroTelefono.value = '';
    coordenadas.value = '';
    categoria.value = '';
})

$('#Btn_ModificarPOI').on('click', function (event) {
    var comboPois = document.getElementById('Cbo_Pois');
    var tablaSeleccion = document.getElementById('SeleccionPOI');
    tablaSeleccion.style.display = "none";

    var tablaCuerpo = document.getElementById('CuerpoPOI');
    tablaCuerpo.style.display = "block";

    var divBotonesList = document.getElementById('divBotonesList');
    divBotonesList.style.display = "block";

    CargarPOIs(function (pois) {
        pois.forEach(function (poiData) {
            if (poiData.Id == comboPois.value) {
                var nombre = document.getElementById('Txt_NombreList');
                var direccion = document.getElementById('Txt_DireccionList');
                var nroTelefono = document.getElementById('Lng_NroTelefonoList');
                var coordenadas = document.getElementById('Txt_CoordenadasList');
                var categoria = document.getElementById('Cbo_CategoriasList');

                nombre.value = poiData.Name;
                direccion.value = poiData.Address;
                if (poiData.Phone != null) {
                    nroTelefono.value = poiData.Phone.replace(/\s+/g, '');
                }
                coordenadas.value = poiData.XLon + ',' + poiData.YLat;
                categoria.value = poiData.Category;
            }
        })
    });
})

$('#Btn_GuardarPOI').on('click', function (event) {
    //Pongo esta función para evitar que se cierre el form ante una validación
    event.preventDefault();
    //Realizo la validación y el guardado si corresponde. Además cierro el form
    if (GuardarPOI('A'))
    {
        $('#formModal').modal('hide');
    }
})

$('#Btn_GuardarPOIList').on('click', function (event) {
    //Pongo esta función para evitar que se cierre el form ante una validación
    event.preventDefault();
    //Realizo la validación y el guardado si corresponde. Además cierro el form
    if (GuardarPOI('M')) {
        $('#listModal').modal('hide');
    }
})

function GuardarPOI(altamodificacion) {

    var nombre = document.getElementById('Txt_Nombre');
    var direccion = document.getElementById('Txt_Direccion');
    var nroTelefono = document.getElementById('Lng_NroTelefono');
    var coordenadas = document.getElementById('Txt_Coordenadas');
    var categoria = document.getElementById('Cbo_Categorias');
    var metodo = 'POST';

    if (altamodificacion == 'M')
    {
        nombre = document.getElementById('Txt_NombreList');
        direccion = document.getElementById('Txt_DireccionList');
        nroTelefono = document.getElementById('Lng_NroTelefonoList');
        coordenadas = document.getElementById('Txt_CoordenadasList');
        categoria = document.getElementById('Cbo_CategoriasList');
        metodo = "PUT";
    }

    
    if (!ValidacionesPOI(nombre, direccion, nroTelefono, coordenadas, categoria, altamodificacion)) {
        return false;
    }

    var listacoordenadas = coordenadas.value.split(',');

    var datos = JSON.stringify({
        "entity": {
            "Id": "",
            "Nombre": nombre.value,
            "Direccion": direccion.value,
            "NroTelefono": nroTelefono.value,
            "CoordenadaX": listacoordenadas[0].replace('.', ','),
            "CoordenadaY": listacoordenadas[1].replace('.', ','),
            "Categoria": categoria.value
        }
    });

    fetch('../api/ValidateForm', {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: datos,
    })
        .then(function (response) {
        return response.json();
        }).then(function (data) {
            if (data.isvalid == true) {
                fetch('../api/POIs', {
                    method: metodo,
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: datos,
                }).then(function (response) {
                    return response.json();
                }).then(function (resultado) {
                    if (resultado.isvalid == true) {
                        MostrarMensajeError('Se han guardado los datos correctamente.', altamodificacion)
                        if (altamodificacion == 'A') {
                            SeteoSoloLecturaModal(true);
                        }
                        else {
                            InicioVariablesListModal();
                        }
                    }
                    else {
                        MostrarMensajeError(resultado.mensajeerror, altamodificacion);
                    }
                }).catch(function (e) {
                    console.error(e)
                });
            }
            else
            {
                MostrarMensajeError(data.mensajeerror, altamodificacion);
            }
    }).catch(function (e) {
        console.error(e)
    });
    return validacionok;
};
