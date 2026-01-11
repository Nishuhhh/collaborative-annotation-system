const fs = require('fs');
const pdfParse = require('pdf-parse');

console.log('Type of pdfParse:', typeof pdfParse);
console.log('pdfParse:', pdfParse);

// If you have a test PDF file
// const dataBuffer = fs.readFileSync('test.pdf');
// pdfParse(dataBuffer).then(data => console.log(data.text));