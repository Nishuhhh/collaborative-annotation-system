const Document = require('../models/document');
const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

// Safe decode function - handles special characters
const safeDecode = (str) => {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    return str.replace(/%([0-9A-Fa-f]{2})/g, (match, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    });
  }
};

// Function to extract text from PDF
const extractPdfText = (filePath) => {
  return new Promise((resolve, reject) => {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      reject(new Error('File not found: ' + absolutePath));
      return;
    }

    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', (errData) => {
      console.log('PDF Parse Error:', errData);
      reject(new Error('Failed to parse PDF'));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      try {
        let text = '';

        if (pdfData && pdfData.Pages) {
          pdfData.Pages.forEach((page) => {
            if (page.Texts) {
              page.Texts.forEach((textItem) => {
                if (textItem.R) {
                  textItem.R.forEach((r) => {
                    if (r.T) {
                      text += safeDecode(r.T) + ' ';
                    }
                  });
                }
              });
            }
            text += '\n';
          });
        }

        console.log('PDF parsed successfully, text length:', text.length);
        resolve(text.trim());
      } catch (err) {
        console.log('Text extraction error:', err);
        reject(err);
      }
    });

    pdfParser.loadPDF(absolutePath);
  });
};

// Upload document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    let content = '';
    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    console.log('Processing file:', filePath, 'Type:', mimeType);

    // Extract text based on file type
    if (mimeType === 'text/plain') {
      content = fs.readFileSync(filePath, 'utf-8');
    } else if (mimeType === 'application/pdf') {
      content = await extractPdfText(filePath);
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Only .txt and .pdf files are allowed' });
    }

    console.log('Content extracted, length:', content.length);

    // Create document in database
    const document = await Document.create({
      title: req.file.originalname,
      content: content,
      originalFile: {
        filename: req.file.originalname,
        mimeType: mimeType,
        size: req.file.size
      },
      uploadedBy: userId
    });

    // Delete the uploaded file
    fs.unlinkSync(filePath);

    res.status(201).json({
      _id: document._id,
      title: document.title,
      createdAt: document.createdAt
    });
  } catch (error) {
    console.log('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all documents
const getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.find()
      .select('title originalFile uploadedBy createdAt')
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single document by ID
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('uploadedBy', 'username');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadDocument, getAllDocuments, getDocumentById };