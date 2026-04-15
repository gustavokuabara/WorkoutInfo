import React from 'react'
import ReactDOM from 'react-dom/client'
import { jwtDecode } from "jwt-decode";
import toast, { Toaster } from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/home'
import Cadastro from './pages/cadastro' 
import Dashboard from './pages/dashboard' 
import ConfirmarEmail from './pages/confirmar'
import EsqueciSenha from './pages/esquecisenha'
import ResetarSenha from './pages/resetarsenha'
import './index.css'

/* 
Função Auxiliar: Checa se o token existe E se não expirou, tbm tem em
dashboard mas melhor ter aqui tbm pra usar nas rotas
*/
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; 
    return decoded.exp > currentTime; // True se o futuro (exp) for maior que agora
  } catch (error) {
    return false;
  }
};

// Só entra se estiver logado com token válido
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!isTokenValid(token)) {
    if (token) {
        localStorage.removeItem('token'); // Limpa token velho
        toast.error("Sessão expirada. Faça login novamente.");
    } else {
        toast.error("Acesso negado. Por favor, faça login.");
    }
    return <Navigate to="/login" />;
  }
  return children;
};

// Se já estiver logado, pula o login e vai pro Dashboard
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (isTokenValid(token)) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster position="top-center" reverseOrder={false} />
    <BrowserRouter>
      <Routes>
        {/* PublicRoute aqui para não mostrar login pra quem já está logado */}
        <Route path="/login" element={
          <PublicRoute>
            <Home />
          </PublicRoute>
        } />
        
        <Route path="/cadastro" element={<Cadastro />} />
        <Route path="/confirmar/:token" element={<ConfirmarEmail />} />
        <Route path="/forgot-password" element={<EsqueciSenha />} />
        <Route path="/reset-password" element={<Navigate to="/login" />} />
        <Route path="/reset-password/:token" element={<ResetarSenha />} />

        <Route 
          path="/dashboard" 
          element={
            <PrivateRoute>
              <Dashboard /> 
            </PrivateRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)