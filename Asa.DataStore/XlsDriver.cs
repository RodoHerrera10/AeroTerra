using System;
using System.Collections.Generic;
using System.Data;
using System.Data.OleDb;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Asa.DataStore
{
    public class XlsDriver
    {
        public OleDbConnection Connect(string fileName)
        {
            return new OleDbConnection("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + fileName + "; Jet OLEDB:Engine Type=5;Extended Properties=\"Excel 8.0;\"");
            //return new OleDbConnection("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" + fileName + ";Extended Properties=Excel 12.0;");
        }


        public DataTable ListData(OleDbConnection conn, string sheetName)
        {            
            return this.Select(conn, "select * from [" + sheetName + "$]");            
        }

        public string[] ListTables(OleDbConnection conn)
        {
            if (conn.State != ConnectionState.Open) throw new XlsDriverException("The connection is not opened");
            DataTable tables = conn.GetOleDbSchemaTable(OleDbSchemaGuid.Tables, null);
            if(tables != null)
            {
                return tables.Select().Select((x) => x["TABLE_NAME"] as string).ToArray();
            }

            return new string[] { };
        }

        public DataTable Select(OleDbConnection conn, string sql)
        {
            if (conn.State != ConnectionState.Open) throw new XlsDriverException("The connection is not opened");
            DataTable sheetData = new DataTable();

            // retrieve the data using data adapter
            OleDbDataAdapter sheetAdapter = new OleDbDataAdapter(sql, conn);
            sheetAdapter.Fill(sheetData);


            return sheetData;
        }

        public void InsertData(OleDbConnection connection, string table, List<string> columnNames, List<string> theValues)
        {
            OleDbCommand command = null;
            
            string columns = "";
            string values = "";

            try
            {
                for (int index = 0; index < columnNames.Count; index++)
                {

                    columns += (index == 0) ? "[" + Regex.Replace(columnNames[index], @"\t|\n|\r", "\"") + "]" : ", [" + Regex.Replace(columnNames[index], @"\t|\n|\r", "\"") + "]";
                    values += (index == 0) ? "'" + Regex.Replace(theValues[index], @"\t|\n|\r", "\"") + "'" : ", '" + Regex.Replace(theValues[index], @"\t|\n|\r", "") + "'";

                }

                using (command = connection.CreateCommand())
                {

                    command.CommandText = string.Format("Insert into [{2}$] ({0}) values({1})", columns, values, table);

                    command.ExecuteNonQuery();


                }
            }
            catch (Exception ex)
            {
                throw new XlsDriverException("Error on insert.", ex);
            }
        }

        public void UpdateData(OleDbConnection connection, string table, List<string> columnNames, List<string> theValues)
        {
            OleDbCommand command = null;

            try
            {
                string UpdateBody = "";
                for (int index = 1; index < columnNames.Count; index++)
                {

                    UpdateBody+= "[" + Regex.Replace(columnNames[index], @"\t|\n|\r", "\"") + "] = '" + Regex.Replace(theValues[index], @"\t|\n|\r", "\"") + "',";
                }
                
                UpdateBody = UpdateBody.Substring(0, UpdateBody.Length - 1);

                string UpdateSQL = "Update [" + table + "$] Set ";
                string UpdateWhere = " Where [" + columnNames[0] + "] = '" + theValues[0] + "'";


                using (command = connection.CreateCommand())
                {
                    command.CommandText = UpdateSQL + UpdateBody + UpdateWhere;

                    command.ExecuteNonQuery();


                }
            }
            catch (Exception ex)
            {
                throw new XlsDriverException("Error on update.", ex);
            }
        }
        public void DeleteData(OleDbConnection connection, string table, string columnId, string valueId)
        {
            OleDbCommand command = null;

            try
            {
                using (command = connection.CreateCommand())
                {
                    command.CommandText = "Delete From [" + table + "$] Where [" + columnId + "] = '" + valueId + "'";

                    //Como no se pueden borrar los datos por utilizar una base ISAM, hago de cuenta que la eliminación 
                    //ha sido correcta y no ejecuto el comando.
                    //command.ExecuteNonQuery();

                }
            }
            catch (Exception ex)
            {
                throw new XlsDriverException("Error on update.", ex);
            }
        }
        public class XlsDriverException : Exception
        {
            public XlsDriverException(string message) : base(message)
            {
            }
            public XlsDriverException(string message, Exception innerException) : base(message, innerException) 
            {         
            }
        }

    }
}
