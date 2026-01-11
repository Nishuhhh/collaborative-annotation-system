import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDocuments, uploadDocument } from '../services/api';

function DocumentList({ user, onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await getAllDocuments();
      setDocuments(response.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file select
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user._id);

      await uploadDocument(formData);
      setFile(null);
      setShowModal(false);
      loadDocuments();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setFile(null);
    setError('');
  };

  // Open document
  const openDocument = (docId) => {
    navigate(`/document/${docId}`);
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-icon">📄</span>
          <span className="nav-title">DocAnnotate</span>
        </div>
        <div className="nav-user">
          <span className="user-name">Welcome, {user.username}</span>
          <button onClick={onLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <h1>My Documents</h1>
          <button className="btn-add" onClick={() => setShowModal(true)}>
            + Add Document
          </button>
        </div>

        {/* Documents Grid */}
        {documents.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📁</span>
            <h2>No Documents Yet</h2>
            <p>Upload your first document to get started</p>
            <button className="btn-add" onClick={() => setShowModal(true)}>
              + Add Document
            </button>
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="document-card"
                onClick={() => openDocument(doc._id)}
              >
                <div className="card-icon">
                  {doc.originalFile?.mimeType === 'application/pdf' ? '📕' : '📄'}
                </div>
                <div className="card-content">
                  <h3 className="card-title">{doc.title}</h3>
                  <p className="card-date">
                    {new Date(doc.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Document</h2>
              <button className="btn-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              <div
                className={`drop-zone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
              >
                {file ? (
                  <>
                    <span className="drop-icon">✅</span>
                    <p className="drop-text">{file.name}</p>
                    <p className="drop-hint">Click to change file</p>
                  </>
                ) : (
                  <>
                    <span className="drop-icon">📁</span>
                    <p className="drop-text">Drag & Drop your file here</p>
                    <p className="drop-hint">or click to browse</p>
                    <p className="drop-formats">Supports: PDF, TXT</p>
                  </>
                )}
                <input
                  type="file"
                  id="fileInput"
                  accept=".txt,.pdf"
                  onChange={handleFileChange}
                  hidden
                />
              </div>

              {error && <p className="error-message">{error}</p>}
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button
                className="btn-upload"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentList;