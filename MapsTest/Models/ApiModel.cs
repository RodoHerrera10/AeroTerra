using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace Asa.MapApi.Models
{
    public class ApiModel
    {
        public class ModeloPOI
        {
            public string Id { get; set; }
            public string Nombre { get; set; }
            public string Direccion { get; set; }
            public long NroTelefono { get; set; }
            public double CoordenadaX { get; set; }
            public double CoordenadaY { get; set; }
            public string Categoria { get; set; }
        }

        public class ModeloCategoria
        {
            public string Id { get; set; }
            public string Value { get; set; }

        }

        public List<Object> ListPOIS()
        {
            return null;
        }
        public void InsertPOI(Dictionary<string, object> entity) { }        
        public void UpdatePOI(string id, Dictionary<string, object> entity) { }
        public void DeletePOI(string id) { }

    }
}