import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDocumentById, getAnnotationsByDocument, createAnnotation, deleteAnnotation } from '../services/api';
import { socket, connectSocket, joinDocument, leaveDocument } from '../services/socket';

function DocumentViewer({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [document, setDocument] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fontSize, setFontSize] = useState(16);
  
  const [activeAnnotationId, setActiveAnnotationId] = useState(null);
  
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [showAddButton, setShowAddButton] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  // Load data + Setup socket
  useEffect(() => {
    loadDocument();
    loadAnnotations();
    
    // Socket: Connect and join room
    connectSocket();
    joinDocument(id);

    // Socket: Listen for refresh
    socket.on('refresh-annotations', () => {
      console.log('🔄 Received refresh signal');
      loadAnnotations();
    });

    // Cleanup when leaving page
    return () => {
      leaveDocument(id);
      socket.off('refresh-annotations');
    };
  }, [id]);

  const loadDocument = async () => {
    try {
      const response = await getDocumentById(id);
      setDocument(response.data);
    } catch (err) {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadAnnotations = async () => {
    try {
      const response = await getAnnotationsByDocument(id);
      setAnnotations(response.data);
    } catch (err) {
      console.error('Failed to load annotations:', err);
    }
  };

  const increaseFontSize = () => {
    if (fontSize < 28) setFontSize(fontSize + 2);
  };

  const decreaseFontSize = () => {
    if (fontSize > 12) setFontSize(fontSize - 2);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text.length > 0) {
      try {
        const range = selection.getRangeAt(0);
        const container = window.document.getElementById('document-content');
        
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(container);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        const startOffset = preSelectionRange.toString().length;
        const endOffset = startOffset + text.length;

        const rect = range.getBoundingClientRect();
        
        setSelectedText(text);
        setSelectionRange({ startOffset, endOffset });
        setButtonPosition({
          x: rect.left + (rect.width / 2),
          y: rect.bottom + 10
        });
        setShowAddButton(true);
        setActiveAnnotationId(null);
      } catch (err) {
        console.error('Selection error:', err);
      }
    }
  };

  const handleOpenCommentBox = () => {
    setShowAddButton(false);
    setShowCommentBox(true);
  };

  const handleSaveAnnotation = async () => {
    if (!comment.trim()) {
      alert('Please enter a comment');
      return;
    }

    setSaving(true);
    try {
      await createAnnotation({
        documentId: id,
        userId: user._id,
        startOffset: selectionRange.startOffset,
        endOffset: selectionRange.endOffset,
        selectedText: selectedText,
        comment: comment.trim()
      });
      // Socket will trigger refresh automatically!
      handleCancelAnnotation();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save annotation');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelAnnotation = () => {
    setShowCommentBox(false);
    setShowAddButton(false);
    setComment('');
    setSelectedText('');
    setSelectionRange(null);
    window.getSelection().removeAllRanges();
  };

  const handleDeleteAnnotation = async (annotationId) => {
    if (!window.confirm('Delete this annotation?')) return;

    try {
      await deleteAnnotation(annotationId, user._id);
      // Socket will trigger refresh automatically!
      setActiveAnnotationId(null);
    } catch (err) {
      alert('Failed to delete annotation');
    }
  };

  const handleAnnotationClick = (annotationId) => {
    if (activeAnnotationId === annotationId) {
      setActiveAnnotationId(null);
    } else {
      setActiveAnnotationId(annotationId);
    }
  };

  const renderContentWithHighlights = () => {
    if (!document || !document.content) return null;

    const content = document.content;
    const activeAnnotation = annotations.find(a => a._id === activeAnnotationId);
    
    if (!activeAnnotation) {
      return <span>{content}</span>;
    }

    const before = content.substring(0, activeAnnotation.startOffset);
    const highlighted = content.substring(activeAnnotation.startOffset, activeAnnotation.endOffset);
    const after = content.substring(activeAnnotation.endOffset);

    return (
      <>
        <span>{before}</span>
        <mark className="highlight">{highlighted}</mark>
        <span>{after}</span>
      </>
    );
  };

  if (loading) {
    return (
      <div className="viewer-loading">
        <div className="spinner"></div>
        <p>Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viewer-error">
        <h2>😕 {error}</h2>
        <button onClick={() => navigate('/documents')}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="viewer-container">
      <header className="viewer-header">
        <div className="header-left">
          <button className="btn-back" onClick={() => navigate('/documents')}>
            ← Back
          </button>
          <h1 className="doc-title">{document?.title}</h1>
        </div>
        <div className="header-right">
          <div className="font-controls">
            <button onClick={decreaseFontSize}>A-</button>
            <span>{fontSize}px</span>
            <button onClick={increaseFontSize}>A+</button>
          </div>
        </div>
      </header>

      <div className="viewer-body">
        <div className="document-panel">
          <div className="document-toolbar">
            <span>📄 Uploaded by: {document?.uploadedBy?.username || 'Unknown'}</span>
            <span>💡 Select text to add annotation</span>
          </div>
          <div
            id="document-content"
            className="document-content"
            style={{ fontSize: `${fontSize}px` }}
            onMouseUp={handleTextSelection}
          >
            {renderContentWithHighlights()}
          </div>

          {showAddButton && (
            <button
              className="add-comment-btn"
              style={{
                position: 'fixed',
                left: `${buttonPosition.x}px`,
                top: `${buttonPosition.y}px`,
                transform: 'translateX(-50%)'
              }}
              onClick={handleOpenCommentBox}
            >
              💬 Add Comment
            </button>
          )}
        </div>

        <div className="annotations-panel">
          <div className="panel-header">
            <h2>💬 Annotations ({annotations.length})</h2>
          </div>
          
          <div className="annotations-list">
            {annotations.length === 0 ? (
              <div className="no-annotations">
                <span className="empty-icon">📝</span>
                <p>No annotations yet</p>
                <p className="hint">Select text to add one</p>
              </div>
            ) : (
              annotations.map((annotation) => (
                <div
                  key={annotation._id}
                  className={`annotation-card ${activeAnnotationId === annotation._id ? 'active' : ''}`}
                  onClick={() => handleAnnotationClick(annotation._id)}
                >
                  <div className="annotation-meta">
                    <span className="annotation-user">
                      👤 {annotation.userId?.username || 'Unknown'}
                    </span>
                    <span className="annotation-date">
                      {new Date(annotation.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="annotation-selected">
                    "{annotation.selectedText.length > 50 
                      ? annotation.selectedText.substring(0, 50) + '...' 
                      : annotation.selectedText}"
                  </div>
                  <div className="annotation-comment">
                    {annotation.comment}
                  </div>
                  {annotation.userId?._id === user._id && (
                    <button
                      className="btn-delete-annotation"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAnnotation(annotation._id);
                      }}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showCommentBox && (
        <div className="modal-overlay" onClick={handleCancelAnnotation}>
          <div className="comment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Comment</h3>
              <button className="btn-close-modal" onClick={handleCancelAnnotation}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="selected-text-preview">
                <label>Selected Text:</label>
                <p>"{selectedText.length > 100 
                  ? selectedText.substring(0, 100) + '...' 
                  : selectedText}"</p>
              </div>
              <div className="comment-input">
                <label>Your Comment:</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your comment here..."
                  rows={4}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancelAnnotation}>
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleSaveAnnotation}
                disabled={saving || !comment.trim()}
              >
                {saving ? 'Saving...' : 'Save Comment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentViewer;