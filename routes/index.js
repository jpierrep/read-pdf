var express = require('express');
var router = express.Router();
const pdftotext = require('node-pdftotext');
//https://www.xpdfreader.com/about.html driver
//https://www.npmjs.com/package/pdf-to-text
//https://www.npmjs.com/package/pdf-extracts
var pdfUtil = require('pdf-to-text');
//var pdf_path = "C:\\Users\\jean\\Documents\\NodeProjects\\PDFTest.pdf";
//var pdf_path = "holaPDF.pdf";
var pdf_path = "028-010.pdf";
//var regex="\d{1,2}\.\d{3}\.\d{3}[\-][0-9kK]{1}"
//identificador g devuelve array con todos los emparejamientos
//identificador i devuelve array con informacion de los emparejamientos
var regex=/\d{1,2}\.\d{3}\.\d{3}[\-][0-9kK]{1}/g
/* GET home page. */
router.get('/', function(req, res, next) {



   
  //option to extract text from page 0 to 10
  var option = {from: 0, to: 1};
   
  pdfUtil.pdfToText(pdf_path, option, function(err, data) {
    if (err) throw(err);
   let hola= data.match(regex);
    console.log(hola)
    //console.log(data)
    //console.log(data); //print text    

    cadena = "Para más información, vea Capítulo 3.4.5.1";
expresion = /(capítulo \d+(\.\d)*)/i;
hallado = cadena.match(expresion);
console.log(hallado);
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
