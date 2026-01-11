const mongoose = require('mongoose');

const annotationSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startOffset: {
    type: Number,
    required: true
  },
  endOffset: {
    type: Number,
    required: true
  },
  selectedText: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

annotationSchema.index({ documentId: 1, startOffset: 1 });
annotationSchema.index(
  { documentId: 1, userId: 1, startOffset: 1, endOffset: 1 },
  { unique: true }
);

module.exports = mongoose.model('Annotation', annotationSchema);