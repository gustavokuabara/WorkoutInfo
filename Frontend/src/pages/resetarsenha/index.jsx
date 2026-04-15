import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import toast from "react-hot-toast";
import "./style.css";

function ResetarSenha() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmandoSenha, setVerConfirmandoSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const jaDisparou = useRef(false); 

  useEffect(() => {
    if ((!token || token.length < 20) && !jaDisparou.current) {
      jaDisparou.current = true;
      toast.error("Link de recuperação inválido ou expirado.");
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);

  async function handleReset(e) {
    e.preventDefault();

    // Regra de segurança igual a do cadastro
    const regexSenha = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;

    if (!regexSenha.test(password)) {
      return toast.error(
        "A senha deve ter 8 caracteres, uma maiúscula, um número e um símbolo.",
      );
    }
    if (password !== confirmPassword) {
      return toast.error("As senhas não coincidem.");
    }

    setLoading(true);
    const idToast = toast.loading("Salvando nova senha...");

    try {
      const response = await fetch("http://localhost:8000/resetar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Senha alterada com sucesso!", { id: idToast });
        setTimeout(() => navigate("/login"), 3000);
      } else {
        toast.error(data.detail || "Link inválido ou expirado.", {
          id: idToast,
        });
      }
    } catch (error) {
      toast.error("Erro no servidor.", { id: idToast });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <form onSubmit={handleReset}>
        <h1>Nova Senha</h1>
        <p
          style={{
            color: "#888",
            marginBottom: "20px",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          Crie uma senha forte para sua segurança.
        </p>

        <div className="inputcontainer">
          <div className="input-password-wrapper">
            <input
              type={verSenha ? "text" : "password"}
              placeholder="Digite a nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn-olhinho"
              onClick={() => setVerSenha(!verSenha)}
            >
              {verSenha ? (
                <IoEyeOutline size={20} />
              ) : (
                <IoEyeOffOutline size={20} />
              )}
            </button>
          </div>

          <div className="input-password-wrapper">
            <input
              type={verConfirmandoSenha ? "text" : "password"}
              placeholder="Confirme a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn-olhinho"
              onClick={() => setVerConfirmandoSenha(!verConfirmandoSenha)}
            >
              {verConfirmandoSenha ? (
                <IoEyeOutline size={20} />
              ) : (
                <IoEyeOffOutline size={20} />
              )}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Processando..." : "Redefinir Senha"}
        </button>
      </form>
    </div>
  );
}

export default ResetarSenha;
