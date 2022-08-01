using System;
using System.Collections.Generic;
using System.Data;
using System.Dynamic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Asa.DataStore;

namespace Asa.MapApi.Controllers
{
    public class ApiController : Controller
    {
        // GET: Api
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
                    return Json(new { categories = new string[0] }, JsonRequestBehavior.AllowGet);
                    
            }

            Response.StatusCode = 400;
            return Json(new { error = "Method not suported." }, JsonRequestBehavior.AllowGet);
        }


        public ActionResult ValidateForm(string id, Dictionary<string, object> entity)
        {
            
            if (Request.HttpMethod == "POST")
            {
                // entity <-- inbound
                return Json(new { entity = entity, isvalid = false, errors = new string[] {"Message"} }, JsonRequestBehavior.AllowGet);
            }

            Response.StatusCode = 400;
            return Json(new { error = "Method not suported." }, JsonRequestBehavior.AllowGet);
        }

        public ActionResult POIs(string id, Dictionary<string, object> entity)
        {
            
            switch (Request.HttpMethod)
            {
                case "GET":
                    var _POIs = new List<Object>();
                    
                    _POIs = this._ListPOIS();

                    return Json(new { pois = _POIs.ToArray() }, JsonRequestBehavior.AllowGet);
                case "POST":
                    //InsertPOI (entity)
                    break;
                case "PUT":
                    //UpdatePOI (id, entity)
                    break;
                case "DELETE":
                    //DeletePOI (id)
                    break;
            }

            Response.StatusCode = 400;
            return Json(new { error = "Method not suported." }, JsonRequestBehavior.AllowGet);
        }

        
        private List<Object> _ListPOIS()
        {
            var driver = new XlsDriver();
            string path = System.Web.Hosting.HostingEnvironment.MapPath(@"\bin\Data\ds.xls");
            var conn = driver.Connect(path);
            conn.Open();
            var dt = driver.ListData(conn, "POIs");


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
            conn.Close();
            return data;
        }
    }
}
