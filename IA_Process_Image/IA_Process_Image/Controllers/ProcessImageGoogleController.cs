using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Web.Mvc;
using IA_Process_Image.Models;
using Newtonsoft.Json;
using Google.Cloud.Vision.V1;
using System.IO;
using System.Configuration;

namespace IA_Process_Image.Controllers
{
    public class ProcessImageGoogleController : Controller
    {
        // GET: ProcessImageGoogle
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public JsonResult Capture(string base64String)
        {
            //List de resultado que se recibiran
            List<Model> result = new List<Model>();

            //Clase que se recibira resultado de etiquetas
            WebDetection resultOne = new WebDetection();
            try
            {
                //Obtener informacion de la imagen
                var imageParts = base64String.Split(',').ToList<string>();

                //Convertir imagen en byte
                byte[] imageBytes = Convert.FromBase64String(imageParts[1]);

                //Obtener ruta de credenciales para validar consumo de la API
                string credential_path = @"" + ConfigurationManager.AppSettings["rutaCredenciales"].ToString();

                //Enviar JSON de credenciales
                System.Environment.SetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS", credential_path);
                
                //Crear objeto consumiendo los datos de GOOGLE VISION API
                var client = ImageAnnotatorClient.Create();

                //Enviar imagen en byte al API
                var image = Image.FromBytes(imageBytes);

                //Obtener texto de las imagenes
                var response = client.DetectText(image);

                //Obtener atributos y imagenes relacionadas
                resultOne = client.DetectWebInformation(image);

                //Setear textos encontrados en una lista
                foreach (var annotation in response)
                {
                    Model item = new Model();
                    item.Locale = annotation.Locale;
                    item.Mid = annotation.Mid;
                    item.Description = annotation.Description;
                    result.Add(item);
                    if (annotation.Description != null)
                        Console.WriteLine(annotation.Description);
                }
                
            }
            catch (Exception ex)
            {
                //Enviar mensaje de excepcion en caso ocurra un error
                Model item = new Model();
                item.Locale = "";
                item.Mid = "";
                item.Description = ex.Message;
                result.Add(item);

            }

            //Retorna data con los resultados
            return Json(new { data= result, dataDetail = resultOne }, JsonRequestBehavior.AllowGet);

        }



    }
}