const PDFDocument = require('pdfkit');
const fs = require('fs');
const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('large_test.pdf'));
for(let i=0; i<300; i++) {
  doc.fontSize(12).text('Dies ist ein langer Text, um das PDF zu füllen. '.repeat(20));
}
doc.end();
