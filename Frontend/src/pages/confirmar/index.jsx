import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';

function ConfirmarEmail() {
  // token da url
  const { token } = useParams();
  const navigate = useNavigate();

  // evitar duplicacao do useeffect 
  const jaDisparou = useRef(false);

  useEffect(() => {
    // Só roda se tiver token e se ainda não disparou
    if (!token || jaDisparou.current) {
      console.log("Ignorando execução duplicada ou sem token.");
      return;
    }

    async function validarToken() {
      console.log("Iniciando validação do token no backend...");
      jaDisparou.current = true; 
      
      // Só pra ter algo na tela enquanto espera resposta
      // Devia fazer isso no cadastro trbm mas ja tem resposta no container
      const idToast = toast.loading("Ativando sua conta...");

      try {
        const response = await fetch(`http://localhost:8000/confirmar/${token}`);
        const data = await response.json();

        if (response.ok) {
          console.log("Sucesso: Conta ativada!");
          toast.success("Conta ativada com sucesso! Redirecionando...", { id: idToast });
          setTimeout(() => navigate("/login"), 3000);
        } else {
          console.error("Erro do servidor:", data.detail);
          toast.error(data.detail || "Erro ao ativar conta.", { id: idToast });
        }
      } catch (error) {
        console.error("Erro de conexão:", error);
        toast.error("Erro ao conectar com o servidor.", { id: idToast });
      }
    }

    validarToken();
  }, [token, navigate]);

  return (
    <div style={{ color: "white", textAlign: "center", marginTop: "100px" }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '20px' }}>Workout Info</h1>
      <div style={{ padding: '20px', backgroundColor: '#222', borderRadius: '8px', display: 'inline-block' }}>
        <p>Verificando seus dados de acesso...</p>
        <p style={{ color: '#888', fontSize: '0.9rem' }}>Aguarde um instante.</p>
      </div>
    </div>
  );
}

export default ConfirmarEmail;