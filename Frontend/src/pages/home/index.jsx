import { useState } from "react";
import "./style.css";
import { Link, useNavigate } from "react-router-dom";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import toast from "react-hot-toast";

function Home() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [animarErro, setAnimarErro] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    setLoading(true);
    event.preventDefault();
    setAnimarErro(false);

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("nomeUsuario", data.nome);
        toast.success(`Bem-vindo, ${data.nome}!`, {
          duration: 2000,
        });
        navigate("/dashboard");
      } else {
        setErro(data.detail || "Erro ao fazer login");
        setAnimarErro(true);
      }
    } catch (error) {
      setErro("Erro ao conectar com o servidor.");
      setAnimarErro(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleReenviarEmail() {
    const idToast = toast.loading("Enviando novo e-mail...");
    try {
      const response = await fetch(
        "http://localhost:8000/reenviar-confirmacao",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email }), // Usa o e-mail que já está no input
        },
      );
      const data = await response.json();

      if (response.ok) {
        toast.success(data.msg, { id: idToast });
      } else {
        toast.error(data.detail, { id: idToast });
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor.", { id: idToast });
    }
  }

  return (
    <div>
      <h1 className="titlehome">Workout Info</h1>
      <div className="container">
        <form onSubmit={handleLogin}>
          <h1>Login</h1>
          <div className="inputcontainer">
            <input
              name="email"
              type="email"
              placeholder="E-mail"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="input-password-wrapper">
              <input
                name="password"
                type={verSenha ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
          </div>
          {erro && (
            <div className={`container-erro ${animarErro ? "shake" : ""}`}>
              <span className="erro-texto">{erro}</span>
            </div>
          )}
          {/* Se o erro for sobre confirmacao, mostra o link de reenvio */}
          {erro.includes("confirme seu e-mail") && (
            <p
              style={{ color: "#ffcc00", marginTop: "10px", fontSize: "14px" }}
            >
              Não recebeu?{" "}
              <span
                onClick={handleReenviarEmail}
                style={{
                  textDecoration: "underline",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Clique aqui para reenviar
              </span>
            </p>
          )}
          <button type="submit" disabled={loading}>
            {loading ? "Carregando..." : "Entrar"}
          </button>
          <Link className="link-esqueci-senha" to="/forgot-password">
            Esqueci minha senha
          </Link>
          <Link className="linkcadastro" to="/cadastro">
            Cadastre-se
          </Link>
        </form>
      </div>
    </div>
  );
}

export default Home;
