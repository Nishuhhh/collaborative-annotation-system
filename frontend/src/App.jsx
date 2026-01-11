import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './components/login';
import Register from './components/Registor';
import DocumentList from './components/DocumentList';
import DocumentViewer from './components/DocumentVIewer';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/documents" /> : <Login onLogin={handleLogin} />} 
        />

        <Route 
          path="/register" 
          element={user ? <Navigate to="/documents" /> : <Register onRegister={handleLogin} />} 
        />

        <Route 
          path="/documents" 
          element={
            user ? (
              <DocumentList user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route 
          path="/document/:id" 
          element={
            user ? (
              <DocumentViewer user={user} />
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;