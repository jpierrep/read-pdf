var express = require('express');
var router = express.Router();
const pdftotext = require('node-pdftotext');
//https://www.xpdfreader.com/about.html driver
//https://www.npmjs.com/package/pdf-to-text
//https://www.npmjs.com/package/pdf-extract
//https://stackoverflow.com/questions/33039152/split-pdf-in-separate-file-in-javascript
var pdfUtil = require('pdf-to-text');
var exec=require('child_process').exec
var execSync=require('child_process').execSync
//var pdf_path = "C:\\Users\\jean\\Documents\\NodeProjects\\PDFTest.pdf";
//var pdf_path = "holaPDF.pdf";

//rut a no considerarse pues son de la empresa
var rutsFiltrar=['79.960.660-7']

var pdf_path = "028-010.pdf";
var pdf_name="028-010.pdf"
//var regex="\d{1,2}\.\d{3}\.\d{3}[\-][0-9kK]{1}"
//identificador g devuelve array con todos los emparejamientos
//identificador i devuelve array con informacion de los emparejamientos
var regex=/\d{1,2}\.\d{3}\.\d{3}[\-][0-9kK]{1}/g

/*GET home page.*/




router.get('/', function(req, res, next) {

  /*  let child = exec('Path',
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      if (error !== null) {
        console.log('exec error: ' + error);
      }
  });

  */


 console.log("hola")
  //option to extract text from page 0 to 10
  var option = {from: 0, to: 4};
   
  pdfUtil.pdfToText(pdf_path, option, function(err, data) {
    if (err) throw(err);
    //rut filtrados sin el de empresa
   let rutsEncontrados= data.match(regex).filter(x=>!rutsFiltrar.includes(x));
    console.log("rutsencontrados",rutsEncontrados)
    //console.log(data)
    //console.log(data); //print text    

    cadena = "Para más información, vea Capítulo 3.4.5.1";
expresion = /(capítulo \d+(\.\d)*)/i;
hallado = cadena.match(expresion);

console.log('hallado: ',hallado);
 
//segun los ruts incluidos en el archivo (ruts encontrados armar json) encontrar todas las fichas activas asociada al rut 
//y con ellas los centros costo correspondientes
let tablaMapPersonas=[
{RUT:'8.849.245-5',PAGINA:1,FICHA:'ASDAS12',CENCO2_CODI:'027-001'},
{RUT:'8.849.245-6',PAGINA:4,FICHA:'ASDAS12',CENCO2_CODI:'027-001'},
{RUT:'8.849.245-5',PAGINA:15,FICHA:'ASDAS12',CENCO2_CODI:'027-001'},
{RUT:'8.849.245-5',PAGINA:7,FICHA:'ASDAS12',CENCO2_CODI:'028-001'},
]

let distinctCC=['027-001','028-001']

distinctCC.forEach(cc=>{
    console.log("Empezando el ..."+cc)

    let pagesCC=tablaMapPersonas.filter(x=>x["CENCO2_CODI"]==cc).map(x=>x["PAGINA"]).join(" ")
    console.log("pagesCC",pagesCC)
  
    let child = exec('pdftk ' +pdf_name +' cat '+pagesCC+' output '+cc+'.pdf',
    function (error, stdout, stderr) {
      console.log('stdout: ' + stdout);
      console.log('stderr: ' + stderr);
      console.log("terminado el cc "+cc)

      if (error !== null) {
        console.log('exec error: ' + error);
       
      }
    });
    
     
})

console.log("terminado")





});
   




 /*
let options = { pdfPath: "C:/Users/jean/Documents/NodeProjects/PDFTest.pdf", layout: true, first: 3 };
pdftotext(options, err => {
    if (err) {
        console.log(err);
    }
    else {
        console.log('converted to txt');
    }
});

*/

  res.render('index', { title: 'Express' });
});

module.exports = router;
