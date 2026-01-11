const express = require('express');
const router = express.Router();
const { createAnnotation, getAnnotationsByDocument, deleteAnnotation } = require('../controllers/annotationController');

// POST /api/annotations
router.post('/', createAnnotation);

// GET /api/annotations/:documentId
router.get('/:documentId', getAnnotationsByDocument);

// DELETE /api/annotations/:id
router.delete('/:id', deleteAnnotation);

module.exports = router;