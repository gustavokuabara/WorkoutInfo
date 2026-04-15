import { useState } from "react";
import "./style.css";
import { Link, useNavigate } from "react-router-dom";
import { IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import toast from "react-hot-toast";

function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm_password, setConfirmPassword] = useState("");

  // Estados para os olhinhos
  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false);

  async function handleCadastro(event) {
    event.preventDefault();

    // Toast de validacao locais
    if (!nome || !email || !password || !confirm_password) {
      toast.error("Preencha todos os campos!");
      return;
    }

    if (password !== confirm_password) {
      toast.error("As senhas não batem!");
      return;
    }

    const regexSenha = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*[0-9]).{8,}$/;
    if (!regexSenha.test(password)) {
      toast.error(
        "A senha deve ter 8 caracteres, uma letra maiúscula, um número e um símbolo especial.",
      );
      return;
    }
    
    if (!email.includes(".") || email.split(".").pop().length < 2) {
      toast.error("Por favor, insira um e-mail válido (ex: .com)");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/cadastro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nome,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          "Cadastro realizado! Verifique seu e-mail para confirmar a conta.",
          {
            duration: 5000,
          },
        );

        setTimeout(() => {
          navigate("/login");
        }, 5000);
      } else {
        const data = await response.json();
        let mensagemErro = "Erro ao processar cadastro.";

        if (data.detail) {
          if (typeof data.detail === "string") {
            mensagemErro = data.detail;
          } else if (Array.isArray(data.detail)) {
            mensagemErro = data.detail[0].msg;
          }
        }

        toast.error(mensagemErro);
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      toast.error(
        "Não foi possível conectar ao servidor. Verifique o e-mail ou sua conexão.",
      );
    }
  }

  return (
    <div>
      <h1 className="titlecadastro">Workout Info</h1>
      <div className="containercadastro">
        <form onSubmit={handleCadastro}>
          <h1>Crie sua conta</h1>
          <div className="inputcadastro">
            <input
              name="nome"
              type="text"
              placeholder="Nome"
              autoComplete="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <input
              name="email"
              type="email"
              required
              placeholder="E-mail"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="input-password-wrapper">
              <input
                name="password"
                type={verSenha ? "text" : "password"}
                placeholder="Senha"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                name="confirmPassword"
                type={verConfirmarSenha ? "text" : "password"}
                placeholder="Confirmar Senha"
                autoComplete="new-password"
                value={confirm_password}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="btn-olhinho"
                onClick={() => setVerConfirmarSenha(!verConfirmarSenha)}
              >
                {verConfirmarSenha ? (
                  <IoEyeOutline size={20} />
                ) : (
                  <IoEyeOffOutline size={20} />
                )}
              </button>
            </div>
          </div>
          <button type="submit">Cadastrar</button>
          <Link className="linklogin" to="/login">
            Já tem conta? Faça login
          </Link>
        </form>
      </div>
    </div>
  );
}

export default Cadastro;
