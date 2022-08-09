using System;
using System.Collections.Generic;
using System.Data;
using System.Data.OleDb;
using System.Dynamic;
using System.Linq;
using System.Reflection;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using Asa.DataStore;
using Newtonsoft.Json;
using static Asa.MapApi.Models.ApiModel;

namespace Asa.MapApi.Controllers
{
    public class ApiController : Controller
    {
        public class Error
        {
            public bool isvalid { get; set; }
            public string mensajeerror { get; set; }
        }
        // GET: Api
        static XlsDriver driver = new XlsDriver();
        static string path = System.Web.Hosting.HostingEnvironment.MapPath(@"\bin\Data\ds.xls");
        OleDbConnection conn = driver.Connect(path);
        Error error = new Error();

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Categories(string id, Dictionary<string, object> entity)
        {
            // sheetName: Categorias
            switch (Request.HttpMethod)
            {
                case "GET":
                    var categorias = new List<ModeloCategoria>();
                    categorias = _ListCategorias();

                    return Json(new { categories = categorias.ToArray() }, JsonRequestBehavior.AllowGet);
            }

            Response.StatusCode = 400;
            return Json(new { error = "Method not suported." }, JsonRequestBehavior.AllowGet);
        }

        private bool ValidacionesServidor(Dictionary<string, object> entity)
        {
            bool validacionOK = true;
            error.mensajeerror = "";

            foreach (KeyValuePair<string, object> valor in entity)
            {
                if(valor.Key == "Nombre")
                {
                    if (valor.Value.ToString() == "")
                    {
                        error.mensajeerror = "Debe ingresar un Nombre.";
                        validacionOK = false;
                        break;
                    }
                       
                    if (valor.Value.ToString().All(char.IsDigit))
                    { 
                        error.mensajeerror = "No puede ingresar números en el nombre."; 
                        validacionOK = false;
                        break;
                    }
                }
                if (valor.Key == "Direccion")
                {
                    if (valor.Value.ToString() == "")
                    {
                        error.mensajeerror = "Debe ingresar una Dirección.";
                        validacionOK = false;
                        break;
                    }
                }
                if (valor.Key == "NroTelefono")
                {
                    if (valor.Value.ToString() == "")
                    {
                        error.mensajeerror = "Debe ingresar un Número de Teléfono.";
                        validacionOK = false;
                        break;
                    }
                    if (!long.TryParse(valor.Value.ToString(), out _))
                    { 
                        error.mensajeerror = "No puede ingresar letras, por favor ingrese un Número de Teléfono.";
                        validacionOK = false;
                        break;
                    }
                    //Por alguna razón que desconozco, no me toma bien la expresión y marca como inválida a una expresión correcta.
                    //if (!Regex.IsMatch(valor.Value.ToString(), @"/^(?:(?:00)?549?)?0?(?:11|[2368]\d)(?:(?=\d{0,2}15)\d{2})??\d{8}$/"))
                    //{ 
                    //    error.mensajeerror = "El número ingresado no coincide con formato correcto de teléfono. Intente nuevamente.";
                    //    validacionOK = false;
                    //    break;
                    //}
                }
                if (valor.Key == "CoodenadaX" || valor.Key == "CoordenadaY")
                {
                    if (valor.Value.ToString() == "")
                    {   
                        error.mensajeerror = "Debe ingresar un coordenada.";
                        validacionOK = false;
                        break;
                    }
                    if (!double.TryParse(valor.Value.ToString(), out _))
                    { 
                        error.mensajeerror = "Debe ingresar una coordenada numérica.";
                        validacionOK = false;
                        break;
                    }
                }
                if (valor.Key == "CoodenadaX")
                {
                    if (Convert.ToDouble(valor.Value.ToString()) < -180 || Convert.ToDouble(valor.Value.ToString()) > 180)
                    { 
                        error.mensajeerror = "Debe ingresar una coordenada entre -180 y 180 para X.";
                        validacionOK = false;
                        break;
                    }
                }
                if (valor.Key == "CoodenadaY")
                {
                    if (Convert.ToDouble(valor.Value.ToString()) < -90 || Convert.ToDouble(valor.Value.ToString()) > 90)
                    { 
                        error.mensajeerror = "Debe ingresar una coordenada entre -90 y 90 para Y.";
                        validacionOK = false;
                        break;
                    }
                }
                if (valor.Key == "Categoria")
                {
                    if (valor.Value.ToString() == "")
                    { 
                        error.mensajeerror = "Debe seleccionar una categoria.";
                        validacionOK = false;
                        break;
                    }
                }
            }
            return validacionOK;
        }
        public ActionResult ValidateForm(string id, Dictionary<string, object> entity)
        {
            
            if (Request.HttpMethod == "POST")
            {
                error.isvalid = ValidacionesServidor(entity);
                // entity <-- inbound
                return Json(new { isvalid = error.isvalid, mensajeerror = error.mensajeerror }, JsonRequestBehavior.AllowGet);
            }

            Response.StatusCode = 400;
            return Json(new { error = "Method not suported." }, JsonRequestBehavior.AllowGet);
        }

        private bool GuardarPOI(ModeloPOI p_poi)
        {
            try
            { 
                if(conn.State == ConnectionState.Closed)
                    conn.Open();

                var colNombres = new List<string> { "Id", "Name", "Address", "Phone", "Category", "X (Lon)", "Y (Lat)" };

                //Creo un id aleatorio y chequeo si ya existe en la base
                //Si ya existe sigo creando hasta encontrar uno que no exista
                p_poi.Id = Guid.NewGuid().ToString("N");
                while (!ChequeoIdPOI(p_poi.Id))
                {
                    p_poi.Id = Guid.NewGuid().ToString("N");
                }

                var colValores = new List<string> { p_poi.Id, p_poi.Nombre, p_poi.Direccion, p_poi.NroTelefono.ToString(), p_poi.Categoria, p_poi.CoordenadaX.ToString(), p_poi.CoordenadaY.ToString()};

                driver.InsertData(conn, "POIs", colNombres, colValores);
                conn.Close();
            }
            catch (Exception ex)
            {
                error.mensajeerror = "Ha ocurrido un error al intentar guardar el POI. " + ex.Message;
                return false;
            }
            return true;
        }
        private bool ActualizarPOI(ModeloPOI p_poi)
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                var colNombres = new List<string> { "Id", "Name", "Address", "Phone", "Category", "X (Lon)", "Y (Lat)" };

                var colValores = new List<string> { p_poi.Id, p_poi.Nombre, p_poi.Direccion, p_poi.NroTelefono.ToString(), p_poi.Categoria, p_poi.CoordenadaX.ToString(), p_poi.CoordenadaY.ToString() };

                driver.UpdateData(conn, "POIs", colNombres, colValores);
                conn.Close();
            }
            catch (Exception ex)
            {
                error.mensajeerror = "Ha ocurrido un error al intentar guardar el POI. " + ex.Message;
                return false;
            }
            return true;
        }
        private bool BorrarPOI(string p_id)
        {
            try
            {
                if (conn.State == ConnectionState.Closed)
                    conn.Open();

                
                driver.DeleteData(conn, "POIs", "Id",p_id);
                conn.Close();
            }
            catch (Exception ex)
            {
                error.mensajeerror = "Ha ocurrido un error al intentar guardar el POI. " + ex.Message;
                return false;
            }
            return true;
        }
        private bool ChequeoIdPOI(string p_id)
        {
            if (conn.State == ConnectionState.Closed)
                conn.Open();

            DataTable dt = driver.Select(conn, "Select id From [POIs$] Where id = '" + p_id + "'");

            if (dt.Rows.Count != 0)
                return false;

            return true;
        }
        public ActionResult POIs(string id, Dictionary<string, object> entity)
        {
            ModeloPOI modelopoi = new ModeloPOI();

            switch (Request.HttpMethod)
            {
                case "GET":
                    var _POIs = new List<Object>();
                    
                    _POIs = this._ListPOIS();

                    return Json(new { pois = _POIs.ToArray() }, JsonRequestBehavior.AllowGet);
                case "POST":
                    modelopoi = ObtenerModeloPOI(entity);

                    error.isvalid = GuardarPOI(modelopoi);

                    return Json(new { isvalid = error.isvalid, mensajeerror = error.mensajeerror }, JsonRequestBehavior.AllowGet);
                case "PUT":
                    modelopoi = ObtenerModeloPOI(entity);

                    error.isvalid = ActualizarPOI(modelopoi);

                    return Json(new { isvalid = error.isvalid, mensajeerror = error.mensajeerror }, JsonRequestBehavior.AllowGet);
                case "DELETE":
                    string entityid = "";
                    foreach (var item in entity)
                    {
                        entityid = item.Value.ToString();
                    }
                    error.isvalid = BorrarPOI(entityid);

                    return Json(new { isvalid = error.isvalid, mensajeerror = error.mensajeerror }, JsonRequestBehavior.AllowGet);
            }

            Response.StatusCode = 400;
            return Json(new { error = "Method not suported." }, JsonRequestBehavior.AllowGet);
        }

        private ModeloPOI ObtenerModeloPOI(Dictionary<string, object> entity)
        {
            ModeloPOI modeloPOI = new ModeloPOI();

            Type tipo = typeof(ModeloPOI);

            foreach (var item in entity)
            {
                var valor = item.Value;

                switch (item.Key)
                {
                    case "NroTelefono":
                        valor = Convert.ToInt64(item.Value);
                        break;
                    case "CoordenadaX":
                    case "CoordenadaY":
                        valor = Convert.ToDouble(item.Value);//.ToString().Replace(".",","));
                        break;
                }

                tipo.GetProperty(item.Key).SetValue(modeloPOI, valor);
            }
            return modeloPOI;
        }
        private DataTable ObtenerTablaExcel(string p_tabla)
        {
            if(conn.State == ConnectionState.Closed)
                conn.Open();
            
            var dt = driver.ListData(conn, p_tabla);

            conn.Close();
            return dt;
        }

        private List<Object> _ListPOIS()
        {
            DataTable dt = ObtenerTablaExcel("POIs");

            var data = new List<Object>();
            foreach (DataRow row in dt.Rows)
            {
                IDictionary<string, object> props = new Dictionary<string, object>();
                foreach (DataColumn col in dt.Columns)
                {
                    props.Add(col.ColumnName.Replace(" ", "").Replace("(", "").Replace(")", ""), row[col.Ordinal]);
                }

                data.Add(props);
                //return data;
            }

            return data;
        }

        private List<ModeloCategoria> _ListCategorias()
        {
            DataTable dt = ObtenerTablaExcel("Categories");
            
            var listaCategorias = new List<ModeloCategoria>();
            foreach (DataRow row in dt.Rows)
            {
                listaCategorias.Add(new ModeloCategoria
                { 
                    Id = row["Id"].ToString(),
                    Value = row["Value"].ToString()
                });
            }
            //conn.Close();
            var tempOrdenado = listaCategorias.OrderBy(x => x.Value).ToArray();
            
            var listaCategoriasOrdenado = new List<ModeloCategoria>();
            listaCategoriasOrdenado.AddRange(tempOrdenado);
            
            return listaCategoriasOrdenado;
        }
    }
}
