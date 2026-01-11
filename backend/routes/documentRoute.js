const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/upload');
const { uploadDocument, getAllDocuments, getDocumentById } = require('../controllers/documentController');
// const upload = require('../middleware/upload');

// POST /api/documents/upload
router.post('/upload', upload.single('file'),uploadDocument);

// GET /api/documents
router.get('/', getAllDocuments);

// GET /api/documents/:id
router.get('/:id', getDocumentById);

module.exports = router;