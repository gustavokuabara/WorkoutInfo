import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Calendar from "react-calendar";
import toast from "react-hot-toast";
import "react-calendar/dist/Calendar.css";
import "./style.css";


//Esse código ta meio baguncado, botei muita funcao junta aqui
//Tem muita coisa interligada e nao vi como separar sem complicar

//validacao do token simples
const isTokenValid = (token) => {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

function Dashboard() {
  const navigate = useNavigate();
  const [treinos, setTreinos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [nomeTreino, setNomeTreino] = useState("");
  const [exercicios, setExercicios] = useState([
    { nome: "", series: "", repeticoes: "", carga: "" },
  ]);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [diasSelecionados, setDiasSelecionados] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [confirmarExclusaoId, setConfirmarExclusaoId] = useState(null);
  const [corTreino, setCorTreino] = useState("#000000");
  const [evolucoes, setEvolucoes] = useState([]);

// nomes subjetivos do q cada funcao faz

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const toggleDia = (dia) => {
    setDiasSelecionados((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
    );
  };

  const adicionarExercicioCampo = () => {
    setExercicios([
      ...exercicios,
      { nome: "", series: "", repeticoes: "", carga: "" },
    ]);
  };

  const carregarTreinos = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:8000/treinos", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTreinos(data);
      } else if (response.status === 401 || response.status === 404) {
        handleLogout();
      }
    } catch (error) {
      console.error("Erro ao carregar treinos:", error);
    } finally {
      setLoading(false);
    }
  };

  const carregarEvolucoes = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch("http://localhost:8000/evolucao", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setEvolucoes(data);
      }
    } catch (e) {
      console.error("Erro ao carregar evoluções:", e);
    }
  };

  const salvarTreino = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const metodo = editandoId ? "PUT" : "POST";
    const url = editandoId
      ? `http://localhost:8000/treinos/${editandoId}`
      : "http://localhost:8000/treinos";

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: nomeTreino,
          exercicios: exercicios,
          dias_semana: diasSelecionados.join(","),
          cor: corTreino,
        }),
      });

      if (response.ok) {
        toast.success(editandoId ? "Atualizado!" : "Criado!");
        fecharModal();
        await carregarTreinos();
        await carregarEvolucoes(); 
      }
    } catch (error) {
      toast.error("Erro ao salvar.");
    }
  };

  // Moldal para leigos = aba pra adcionar e editar treino

  const abrirModalEditar = (treino) => {
    setEditandoId(treino.id);
    setNomeTreino(treino.nome);
    setDiasSelecionados(
      treino.dias_semana ? treino.dias_semana.split(",").map(Number) : [],
    );
    setExercicios(treino.exercicios);
    setCorTreino(treino.cor || "#000000");
    setModalAberto(true);
  };

  const abrirModalNovo = () => {
    setEditandoId(null);
    setNomeTreino("");
    setDiasSelecionados([]);
    setExercicios([{ nome: "", series: "", repeticoes: "", carga: "" }]);
    setCorTreino("#000000");
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditandoId(null);
  };

  const handleExcluirClick = async (id) => {
    if (confirmarExclusaoId !== id) {
      setConfirmarExclusaoId(id);
      setTimeout(() => setConfirmarExclusaoId(null), 3000);
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8000/treinos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        toast.success("Removido!");
        carregarTreinos();
        carregarEvolucoes();
      }
    } catch (error) {
      toast.error("Erro ao excluir.");
    }
  };

  //marcador colorido no treino e calendario
  const renderizarMarcador = ({ date, view }) => {
    if (view !== "month") return null;
    const diaDaSemana = date.getDay();
    const treinosDoDia = treinos.filter((t) =>
      t.dias_semana?.split(",").map(Number).includes(diaDaSemana),
    );

    return (
      <div className="container-dots">
        {treinosDoDia.map((t) => (
          <div
            key={t.id}
            className="dot-treino"
            style={{
              backgroundColor: t.cor || "#000000",
            }}
          ></div>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!isTokenValid(token)) {
      handleLogout();
      return;
    }
    carregarTreinos();
    carregarEvolucoes();
  }, []);


  // aqui comeca o html 
  return (
    <div className="dashboard-wrapper">
      <main className="main-content">
        <header className="dashboard-header">
          <h1>Meus Treinos</h1>
          <button className="btn-novo-treino" onClick={abrirModalNovo}>
            + Novo Treino
          </button>
        </header>

        <section className="lista-treinos-vertical">
          {loading ? (
            <p className="status-msg">Carregando seus treinos...</p>
          ) : treinos.length === 0 ? (
            <div
              className="card-treino-horizontal"
              style={{ justifyContent: "center", opacity: 0.6 }}
            >
              <p>Nenhum treino ainda. Bora começar?</p>
            </div>
          ) : (
            treinos.map((t) => (
              <div key={t.id} className="card-treino-horizontal">
                <div className="info-treino">
                  <div className="cabecalho-treino">
                    <div className="titulo-com-marcador">
                      {" "}
                      <div
                        className="dot-treino-lista"
                        style={{
                          backgroundColor: t.cor || "#000000",
                        }}
                      ></div>
                      <h3>{t.nome}</h3>
                    </div>
                    <div className="acoes-treino">
                      <button
                        className="btn-editar"
                        onClick={() => abrirModalEditar(t)}
                      >
                        ✏️
                      </button>
                      <button
                        className={`btn-excluir ${confirmarExclusaoId === t.id ? "confirmando" : ""}`}
                        onClick={() => handleExcluirClick(t.id)}
                      >
                        {confirmarExclusaoId === t.id ? "Tem certeza?" : "🗑️"}
                      </button>
                    </div>
                  </div>

                  <div className="lista-exercicios-vertical">
                    {t.exercicios?.map((ex, idx) => (
                      <div key={idx} className="item-exercicio">
                        <span className="exercicio-nome">{ex.nome}</span>
                        <div className="exercicio-metas">
                          <span>{ex.series}x</span>
                          <span>{ex.repeticoes}</span>
                          <span className="exercicio-carga">{ex.carga}kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <aside className="sidebar-info">
        <div className="widget-calendario">
          <h4>Calendário</h4>
          <div className="calendario-container">
            <Calendar
              onChange={setDataSelecionada}
              value={dataSelecionada}
              locale="pt-BR"
              tileContent={renderizarMarcador}
            />
          </div>
        </div>

        <div className="widget-stats">
          <h4>Evolução de Carga</h4>
          <div className="lista-evolucao">
            {evolucoes.length > 0 ? (
              evolucoes.map((ev, i) => {
                const aumento = ev.atual - ev.anterior;
                const porcentagem =
                  ev.anterior > 0
                    ? ((aumento / ev.anterior) * 100).toFixed(0)
                    : "100";
                return (
                  <div key={i} className="item-evolucao">
                    <span className="ev-nome">{ev.exercicio}</span>
                    <div className="ev-valores">
                      <span>
                        {ev.anterior}kg → {ev.atual}kg
                      </span>
                      <span className="ev-porcentagem">
                        {" "}
                        +{porcentagem}% total
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="p-vazio">
                Aumente suas cargas para ver a evolução!
              </p>
            )}
          </div>
        </div>

        <button onClick={handleLogout} className="btn-logout">
          Sair da Conta
        </button>
      </aside>

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editandoId ? "Editar Treino" : "Novo Treino"}</h2>
            <form onSubmit={salvarTreino}>
              <input
                type="text"
                placeholder="Nome do Treino"
                value={nomeTreino}
                onChange={(e) => setNomeTreino(e.target.value)}
                required
                className="input-modal"
              />
              <p
                style={{
                  color: "#aaa",
                  fontSize: "0.8rem",
                  marginBottom: "8px",
                }}
              >
                Repetir em:
              </p>
              <div className="seletor-dias">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((label, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`dia-btn ${diasSelecionados.includes(index) ? "ativo" : ""}`}
                    onClick={() => toggleDia(index)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="lista-campos-exercicios">
                {exercicios.map((ex, index) => (
                  <div key={index} className="linha-exercicio">
                    <input
                      placeholder="Exercício"
                      value={ex.nome}
                      onChange={(e) => {
                        const n = [...exercicios];
                        n[index].nome = e.target.value;
                        setExercicios(n);
                      }}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Séries"
                      value={ex.series}
                      onChange={(e) => {
                        const n = [...exercicios];
                        n[index].series = e.target.value;
                        setExercicios(n);
                      }}
                      required
                    />
                    <input
                      placeholder="Reps"
                      value={ex.repeticoes}
                      onChange={(e) => {
                        const n = [...exercicios];
                        n[index].repeticoes = e.target.value;
                        setExercicios(n);
                      }}
                      required
                    />
                    <input
                      type="number"
                      placeholder="Kg"
                      value={ex.carga}
                      onChange={(e) => {
                        const n = [...exercicios];
                        n[index].carga = e.target.value;
                        setExercicios(n);
                      }}
                      required
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={adicionarExercicioCampo}
                className="btn-add-campo"
              >
                + Adicionar Exercício
              </button>
              <div className="seletor-cor">
                <label>Cor do Marcador:</label>
                <input
                  type="color"
                  value={corTreino}
                  onChange={(e) => setCorTreino(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="btn-cancelar"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar">
                  Salvar Treino
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
