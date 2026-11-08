// The pdftotext binary (poppler). Default: "pdftotext" from PATH (server images, Linux). On a machine where another pdftotext
// comes first in PATH (Git for Windows ships xpdf, which lays text out differently), set PDFTOTEXT in .env to poppler's binary.
export const PDFTOTEXT = process.env.PDFTOTEXT || 'pdftotext';
