import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "./style.css";

function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSolicitar(e) {
    e.preventDefault();
    setLoading(true);

    const idToast = toast.loading("Verificando e-mail...");

    try {
      const response = await fetch("http://localhost:8000/esqueci-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("E-mail de recuperação enviado!", { id: idToast });
        setTimeout(() => navigate("/login"), 3000);
      } else {
        toast.error(data.detail || "Erro ao solicitar recuperação", {
          id: idToast,
        });
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor.", { id: idToast });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      {" "}
      <form onSubmit={handleSolicitar}>
        <h1>Recuperar Senha</h1>
        <p
          style={{
            color: "#888",
            marginBottom: "20px",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          Digite seu e-mail para receber o link de redefinição.
        </p>

        <div className="inputcontainer">
          <input
            type="email"
            placeholder="Seu e-mail cadastrado"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link"}
        </button>

        <button
          type="button"
          className="linklogin"
          onClick={() => navigate("/login")}
        >
          Voltar para o Login
        </button>
      </form>
    </div>
  );
}

export default EsqueciSenha;
