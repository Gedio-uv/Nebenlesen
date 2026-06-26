const PDFDocument = require('pdfkit');
const fs = require('fs');
const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test.pdf'));
doc.fontSize(25).text('Guten Tag! Dies ist ein Test.', 100, 100);
doc.end();
