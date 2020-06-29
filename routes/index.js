'use strict'

var express = require('express');
var router = express.Router();
const pdftotext = require('node-pdftotext');
var sql = require("mssql");
//https://www.xpdfreader.com/about.html driver
//https://www.npmjs.com/package/pdf-to-text
//https://www.npmjs.com/package/pdf-extract
//https://stackoverflow.com/questions/33039152/split-pdf-in-separate-file-in-javascript
var pdfUtil = require('pdf-to-text');
var exec = require('child_process').exec
var execSync = require('child_process').execSync
const constants = require('../config/system_constants')
var sql = require('../config/connections')
var fs = require('fs');
var formidable = require('formidable');
var utils = require('../controllers/utils')
let data=require('../data.json')

var inProgress = 0
var ProcessTotal = 0
var ProcessActual = 0

let empresa = 0
let empresaDetalle = constants.EMPRESAS.find(x => x.ID == empresa).BD_SOFTLAND

//var pdf_path = "C:\\Users\\jean\\Documents\\NodeProjects\\PDFTest.pdf";
//var pdf_path = "holaPDF.pdf";

//rut a no considerarse pues son de la empresa
var rutsFiltrar = ['79.960.660-7']

var pdf_path = "CotizacionesPersonal.pdf";
var pdf_name = "CotizacionesPersonal.pdf"
var path_output_base = "pdfFiles/"
//var regex="\d{1,2}\.\d{3}\.\d{3}[\-][0-9kK]{1}"
//identificador g devuelve array con todos los emparejamientos
//identificador i devuelve array con informacion de los emparejamientos
var regex = /\d{1,2}\.\d{3}\.\d{3}[\-][0-9kK]{1}/g

/*GET home page.*/

router.post('/fileupload', async function (req, res, next) {
  //se setea sin timeout el browser pasado 120 seg cierra conexion y lo vuelve a intentar
  req.setTimeout(0);
  console.log("en fileup")
  var form = formidable({ multiples: true });
  form.parse(req, async function (err, fields, files) {
    //console.log(fields)

    var empresa = parseInt(fields.empresa)

    var oldpath = files.filetoupload.path;
    // var newpath = 'C:/Users/jpierre/Desktop/' + files.filetoupload.name;
    var newpath = files.filetoupload.name;

    let rutsEncontrados

    try {
      console.log("EEEEE")
      rutsEncontrados = await getRutsOfFile(oldpath)
     // console.log("ruts", rutsEncontrados)
      //solo si encuentra ruts, si no, mostrar error

      let fechaHora = new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/ /g, "-").replace(/:/g, "-");
      console.log(fechaHora)


      //se respalda el archivo anteriormente cargado, si existe.
      fs.copyFile(pdf_path, 'respaldo_file_uploads/' + fechaHora + pdf_path, function (err) {
       // if (err) throw err;

        //se carga el archivo actual
        fs.rename(oldpath, pdf_path, async function (err) {
          if (err) throw err;
          //await generaFiles(rutsEncontrados)


          let mapPersonas = await generaMapPersonas(rutsEncontrados, empresa)

          if (mapPersonas.length > 0) {

           await generaFiles(mapPersonas, empresa)
           console.log("termina genera Files")
           // res.render('index', { title: 'Compilación Archivos Previred', errormessage: 'Proceso iniciado correctamente, se comenzarán a generar los archivos' });
           var string = encodeURIComponent('OK');
           res.status(200).redirect('/cargarArchivoPrevired?valid=' + string);
         //res.status(200).send({hola:"hola"})
         
          } else {
            res.render('index', { title: 'Compilación Archivos Previred', errormessage: 'Error empresa erronea' });

           

          }


        });


      });


      console.log("new", newpath)
      console.log("old", oldpath)


    } catch (e) {
      console.log("no tiene formato", e)
      res.render('index', { title: 'Compilación Archivos Previred', errormessage: 'Formato del archivo es incorrecto' });
      res.end();


    }
  });



}, function (req, res) {
  //test next function middelware
  res.send('ahoraaa')
})



function getRutsOfFile(pdf_path) {

  return new Promise((resolve, reject) => {

    let option = null
    pdfUtil.pdfToText(pdf_path, option, function (err, data) {
      console.log("errr", err)
      if (err) { reject(err) };
      //rut filtrados sin el de empresa
      let rutsEncontrados = data.match(regex) ? data.match(regex).filter(x => !rutsFiltrar.includes(x)) : null;
      //console.log("rutsss", rutsEncontrados)
      if (!rutsEncontrados) { reject("no hay data") };
      //console.log("rutsencontrados", rutsEncontrados)
      //rutsencontrados [ '8.849.245-5', '13.510.579-1', '10.420.224-1', '8.223.485-3' ]
      //console.log(data)
      //console.log(data); //print text    
      let cadena = "Para más información, vea Capítulo 3.4.5.1";
      let expresion = /(capítulo \d+(\.\d)*)/i;
      let hallado = cadena.match(expresion);

      console.log('hallado: ', hallado);

      resolve(rutsEncontrados)

    })





  })

}

router.get('/cargarArchivoPrevired/', async function (req, res, next) {
  if (req.query.valid){
      let mensaje=req.query.valid
      if (mensaje='OK') 
    res.render('index', { title: 'Compilación Archivos Previred', errormessage:"Proceso concluido correctamente"});
  }else{
  console.log("acaaaaa")
  //res.render('index', { title: 'Compilación Archivos Previred',inProgress:inProgress,progressActual:ProcessActual,processTotal:ProcessTotal});
  res.render('index', { title: 'Compilación Archivos Previred', errormessage: '' });
  }
})



function convierteRutID(rut) {

  rut = rut.substr(0, rut.length - 1);
  rut = replaceAll(rut, ".", "");
  rut = replaceAll(rut, "-", "");
  // rut1=rut.replace(".","");
  if (isNaN(parseFloat(rut)) && !isFinite(rut))
    rut = 0;


  //   console.log("el rut es:" + rut);
  return rut;
}

function replaceAll(string, omit, place, prevstring) {
  if (prevstring && string === prevstring)
    return string;
  prevstring = string.replace(omit, place);
  return replaceAll(prevstring, omit, place, string)
}

async function generaMapPersonas(rutsEncontrados, empresa) {

  return new Promise(async (resolve, reject) => {
    let empresaDetalle = constants.EMPRESAS.find(x => x.ID == empresa).BD_SOFTLAND

    //añadir marcador de inprogress
    inProgress = 1
    ProcessTotal = rutsEncontrados.length
    var personalVigente =require('../data.json')

/*

    var personalVigente = (await sql.query(
      `
      
      select 
       
      LTRIM(RTRIM(per.ficha)) AS 'FICHA', per.codBancoSuc as 'BANCO_CODI', per.nombres as 'NOMBRES', per.rut as 'RUT', per.direccion as 'DIRECCION', per.codComuna as 'COMUNA_CODI', 
      
      per.codCiudad as 'CIUDAD_CODI', per.telefono1 as 'TELEFONO1', per.telefono2 as 'TELEFONO2', per.telefono3 as 'TELEFONO3', 
                      per.fechaNacimient   as 'FECHA_NACIMIENTO', DATEDIFF(YEAR,per.fechaNacimient,GETDATE())
      -(CASE
      WHEN DATEADD(YY,DATEDIFF(YEAR,per.fechaNacimient,GETDATE()),per.fechaNacimient)>GETDATE() THEN
        1
      ELSE
        0 
      END)as 'EDAD',per.sexo as 'SEXO', per.estadoCivil as 'ESTADO CIVIL', per.nacionalidad as 'NACIONALIDAD', per.situacionMilit as 'SITUACION MILITAR',per.fechaIngreso as 'FECHA_INGRESO',per.fechaPrimerCon as 'FECHA_PRIMER_CONTR',per.fechaContratoV as 'FECHA_CONTRATO_VIGENTE' ,per.fechaFiniquito as FECHA_FINIQUITO, 
                           per.tipoPago as 'TIPO_PAGO',per.FecCalVac as 'FECHA_CALCULO_VAC',per.FecTermContrato  as 'FECHA_TERM_CONTRATO', ccp.codiCC AS 'CENCO2_CODI', cp.carCod as 'CARGO_CODI',c.CarNom as 'CARGO_DESC', CAST(ep.FechaMes AS Date) as 'FECHA_SOFT'
                           , ep.IndiceMes as 'INDICE_MES_SOFT', ep.Estado as 'ESTADO', 0 AS EMP_CODI
                    
      ,case when ISNUMERIC (replace(substring(RUT,1,len(RUT)-2),'.',''))=1 then CONVERT(int,replace(substring(RUT,1,len(RUT)-2),'.','')) else 0 end as RUT_ID from 
      
      `+ empresaDetalle + `.softland.sw_vsnpEstadoPer as ep INNER JOIN
      `+ empresaDetalle + `.softland.sw_personal AS per 
      on ep.Ficha = per.ficha INNER JOIN
      `+ empresaDetalle + `.softland.sw_cargoper AS cp ON cp.ficha = ep.Ficha AND cp.vigHasta = '9999-12-01' inner join
      `+ empresaDetalle + `.softland.cwtcarg AS c ON c.CarCod = cp.carCod inner join
      `+ empresaDetalle + `.softland.sw_ccostoper AS ccp ON ccp.ficha = per.ficha AND ccp.vigHasta = '9999-12-01' 
      where estado='V'
      and ep.FechaMes=(select max(FechaMes) from `+ empresaDetalle + `.softland.sw_vsnpRetornaFechaMesExistentes)
      
      
                               `

    )).recordset

    */

   // let jsonDataString=JSON.stringify(personalVigente);
  //  fs.writeFileSync('./data.json',jsonDataString) 


    //option to extract text from page 0 to 10
    var option = null
    //var option = {from: 0, to: 19};



    var filePath = '';
    var fileName = 'personalNoExiste.log';
    var filePathName = filePath + fileName
    if (fs.existsSync(filePathName)) {
      fs.unlinkSync(filePathName);
      console.log("se elimino el archivo log")
    }


    //segun los ruts incluidos en el archivo (ruts encontrados armar json) encontrar todas las fichas activas asociada al rut 
    //y con ellas los centros costo correspondientes
    let tablaMapPersonas = [
      { RUT: '8.849.245-5', PAGINA: 1, FICHA: 'ASDAS12', CENCO2_CODI: '027-001' },
      { RUT: '8.849.245-6', PAGINA: 4, FICHA: 'ASDAS12', CENCO2_CODI: '027-001' },
      { RUT: '8.849.245-5', PAGINA: 15, FICHA: 'ASDAS12', CENCO2_CODI: '027-001' },
      { RUT: '8.849.245-5', PAGINA: 7, FICHA: 'ASDAS12', CENCO2_CODI: '028-001' },
    ]


    tablaMapPersonas = []


    rutsEncontrados.forEach((rutEncontrado, index) => {
      let pagina = index + 1
      let rutId = convierteRutID(rutEncontrado)
      //puede tener mas de una ficha vigente
      let registrosPersona = personalVigente.filter(x => x["RUT_ID"] == rutId)
      if (registrosPersona) {

        registrosPersona.forEach(registroPersona => {
          if (!(tablaMapPersonas.find(x => x["RUT_ID"] == registroPersona["RUT_ID"] && x["CENCO2_CODI"] == registroPersona["CENCO2_CODI"]))) {

            tablaMapPersonas.push({ RUT: registroPersona["RUT"], RUT_ID: registroPersona["RUT_ID"], PAGINA: pagina, FICHA: registroPersona["FICHA"], CENCO2_CODI: registroPersona["CENCO2_CODI"] })

          } else {
            console.log("el registro ya tiene la persona ", rutId, "el el centro costo", registroPersona["CENCO2_CODI"])
          }
        })

      } else {
        console.log("no se encuentra vigente la persona de rut: " + rutEncontrado)
        //no se encuentra la persona en softland entregar error

        fs.appendFile(filePathName, rutEncontrado + '\n', function (err) {
          if (err) throw err;
          console.log('Saved!');
        });

      }

    })

    resolve(tablaMapPersonas)




  })

}


async function generaFiles(tablaMapPersonas) {

  let unique = (value, index, self) => {

    return self.indexOf(value) == index;
  }

  let distinctCC = ['027-001', '028-001']
  distinctCC = tablaMapPersonas.map(x => x["CENCO2_CODI"]).filter(unique);

  //limitar cantidad de archivos
  //for (const cc of distinctCC.slice(0,5)) {
     for (const cc of distinctCC) {
    console.log("Empezando el ..." + cc)
 
    let pagesCC = tablaMapPersonas.filter(x => x["CENCO2_CODI"] == cc).map(x => x["PAGINA"]).join(" ")
    console.log("pagesCC", pagesCC)
    
    let child = await  new Promise ( (resolve,reject)=>{
      exec('pdftk ' + pdf_name + ' cat ' + pagesCC + ' output ' + path_output_base + cc + '.pdf',
      function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        console.log("terminado el cc " + cc)

        
        if (error !== null) {
          console.log('exec error: ' + error);

        }
    resolve()

      });

    })

  }
  console.log("termino todo")
  
 


}



module.exports = router;
