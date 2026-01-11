const Annotation = require('../models/annotation');

// Create annotation
const createAnnotation = async (req, res) => {
  try {
    const { documentId, userId, startOffset, endOffset, selectedText, comment } = req.body;

    // Check duplicate
    const existing = await Annotation.findOne({ documentId, userId, startOffset, endOffset });
    if (existing) {
      return res.status(409).json({ message: 'Annotation already exists' });
    }

    const annotation = await Annotation.create({
      documentId, userId, startOffset, endOffset, selectedText, comment
    });

    const populatedAnnotation = await Annotation.findById(annotation._id)
      .populate('userId', 'username');

    // NEW: Tell everyone in this document room to refresh
    const io = req.app.get('io');
    io.to(documentId).emit('refresh-annotations');

    res.status(201).json(populatedAnnotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get annotations
const getAnnotationsByDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const annotations = await Annotation.find({ documentId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });

    res.status(200).json(annotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete annotation
const deleteAnnotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const annotation = await Annotation.findById(id);
    if (!annotation) {
      return res.status(404).json({ message: 'Annotation not found' });
    }

    if (annotation.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const documentId = annotation.documentId.toString();
    await Annotation.findByIdAndDelete(id);

    // NEW: Tell everyone in this document room to refresh
    const io = req.app.get('io');
    io.to(documentId).emit('refresh-annotations');

    res.status(200).json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createAnnotation, getAnnotationsByDocument, deleteAnnotation };