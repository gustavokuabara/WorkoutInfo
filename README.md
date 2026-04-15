# Workout Info

> **Status do Projeto:** Finalizado / Em manutenção

Site de gestão de treinos para acompanhamento pessoal. Decidi criar um site "completo" com o esperado por mim de um site.
Fiz esse projeto principalmente para acompanhamento próprio.
Dito isso, o site apresenta as seguintes funcionalidades:

## Principais Funcionalidades

- **Lista de Treinos:** Possibilidade de adicionar, remover, editar treinos.
- **Calendário de Treinos:** Identificação visual dos dias de treino.
- **Acompanhamento de Evolução:** Widget de progressão de carga.
- **Sistema de Usuários:** Cadastro, Login ,Recuperação de senha com segurança JWT e persistência de sessão.

## Demonstração

### Dashboard Principal
<p align="center">
  <img src="./Assets/dashboard.png" width="700" alt="Dashboard do Workout Info">
</p>

### Tela de Criação de Conta
<p align="center">
  <img src="./Assets/CriarConta.png" width="700" alt="Criação de Conta">
</p>

### Tela de Login
<p align="center">
  <img src="./Assets/Login.png" width="700" alt="Tela de Login">
</p>

### Tela de Recuperação de Senha
<p align="center">
  <img src="./Assets/RecuperarSenha.png" width="700" alt="Recuperação de Senha">
</p>


## Como rodar o projeto

### Backend (Python)
1. Instale as dependências: `python -m pip install -r requirements.txt`
2. Configure seu arquivo `.env` com suas chaves.
3. Inicie a API: `uvicorn main:app --reload`

### Frontend (React)
1. Instale os pacotes: `npm install`
2. Rode o projeto: `npm run dev`

## Tecnologias

- **Backend:** FastAPI, SQLAlchemy, SQLite, Pydantic.
- **Frontend:** React.js, Vite, React Hot Toast e outras menos importantes.
