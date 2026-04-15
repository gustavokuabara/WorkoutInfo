from fastapi import FastAPI, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, field_validator, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from .utils import enviar_email_confirmacao, enviar_email_reset
from typing import List
from dotenv import load_dotenv
import os
import re
import jwt

load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

# Importando nossos arquivos locais
from . import models, database

# Configuração de Segurança (Bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Criando db
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# Middleware para o react acessar a API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def criar_token_acesso(dados: dict):
    para_codificar = dados.copy()
    # O token vai expirar em 24 horas
    expiracao = datetime.now(timezone.utc) + timedelta(hours=24)
    para_codificar.update({"exp": expiracao})
    token_jwt = jwt.encode(para_codificar, str(SECRET_KEY), algorithm=ALGORITHM)
    return token_jwt

# Molde de Entrada 
class UsuarioSchema(BaseModel):
    nome: str
    email: EmailStr
    password: str

    @field_validator('password')
    @classmethod
    def validar_senha(cls, v):
        if len(v) < 8:
            raise ValueError('A senha deve ter no mínimo 8 caracteres')
        if not re.search(r"[A-Z]", v):
            raise ValueError('A senha precisa de uma letra maiúscula')
        if not re.search(r"[0-9]", v):
            raise ValueError('A senha precisa de um número')
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError('A senha precisa de um caractere especial')
        return v

class ExercicioSchema(BaseModel):
    nome: str
    series: int
    repeticoes: str
    carga: float

class TreinoSchema(BaseModel):
    nome: str
    exercicios: list[ExercicioSchema]
    dias_semana: str = ""
    cor: str = "#000000"


class LoginSchema(BaseModel):
    email: str
    password: str

# Cadastro com HASH
@app.post("/cadastro")
async def cadastrar(user: UsuarioSchema, db: Session = Depends(database.get_db)):
    # Verificar se o e-mail já existe
    db_user = db.query(models.UsuarioModel).filter(models.UsuarioModel.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado!")
    
    # Hash
    senha_hash = pwd_context.hash(user.password)

    novo_usuario = models.UsuarioModel(
        nome=user.nome,
        email=user.email,
        password=senha_hash,
        ativo=False # Ele começa bloqueado!
    )
    
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    token_confirmacao = criar_token_acesso({"email": user.email, "tipo": "confirmacao"})

    try:
        enviar_email_confirmacao(user.email, user.nome, token_confirmacao)
        return {
            "status": "sucesso", 
            "msg": f"Usuário {user.nome} cadastrado! Verifique seu e-mail para ativar a conta."
        }
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
        return {
            "status": "sucesso_com_aviso", 
            "msg": "Usuário criado, mas houve um erro ao enviar o e-mail de ativação."
        }

@app.post("/login")
async def login(user_data: LoginSchema, db: Session = Depends(database.get_db)):
   
    usuario = db.query(models.UsuarioModel).filter(models.UsuarioModel.email == user_data.email).first()

    if not usuario:
        raise HTTPException(status_code=400, detail="E-mail ou senha incorretos")

    if not usuario.ativo:
        raise HTTPException(status_code=400, detail="Por favor, confirme seu e-mail antes de logar.")
    
    senha_valida = pwd_context.verify(user_data.password, usuario.password)

    if not senha_valida:
        raise HTTPException(status_code=400, detail="E-mail ou senha incorretos")

    token = criar_token_acesso({"sub": usuario.email, "user_id": usuario.id, "nome": usuario.nome})

    return {
    "status": "sucesso",
    "access_token": token,  
    "nome": usuario.nome    
}

@app.get("/confirmar/{token}")
async def confirmar_email(token: str, db: Session = Depends(database.get_db)):
    try:
        # Decodifica o token
        payload = jwt.decode(token, str(SECRET_KEY), algorithms=[ALGORITHM])
        print(f"DEBUG PAYLOAD: {payload}")
        
        # Acho q pode ser só sub ou email, usei algum dois dois sem querer
        email_usuario = payload.get("email") or payload.get("sub")

        if not email_usuario:
            raise HTTPException(status_code=400, detail="Token sem informação de e-mail.")

        # Busca e ativa o usuario
        usuario = db.query(models.UsuarioModel).filter(models.UsuarioModel.email == email_usuario).first()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        if usuario.ativo:
            return {"status": "sucesso", "msg": "Esta conta já estava ativa!"}

        usuario.ativo = True
        db.commit()

        return {"status": "sucesso", "msg": "Conta ativada com sucesso!"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="O link de confirmação expirou (passou de 24h).")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Link de confirmação inválido ou corrompido.")
    except Exception as e:
        print(f"Erro interno: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao processar ativação.")

@app.post("/reenviar-confirmacao")
async def reenviar_confirmacao(dados: dict, db: Session = Depends(database.get_db)):
    email = dados.get("email")
    usuario = db.query(models.UsuarioModel).filter(models.UsuarioModel.email == email).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="E-mail não encontrado.")

    if usuario.ativo:
        return {"status": "info", "msg": "Esta conta já está ativa. Pode fazer login!"}

    # Gera um novo token (igual ao do cadastro)
    token_novo = criar_token_acesso({"email": usuario.email, "tipo": "confirmacao"})

    try:
        enviar_email_confirmacao(usuario.email, usuario.nome, token_novo)
        return {"status": "sucesso", "msg": "Novo e-mail de confirmação enviado!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Erro ao enviar e-mail. Tente novamente mais tarde.")

@app.get("/")
def read_root():
    return {"message": "API do Workout Info está ON!"}

# Solicitacao de recuperacao
@app.post("/esqueci-senha")
async def esqueci_senha(dados: dict, db: Session = Depends(database.get_db)):
    email = dados.get("email")
    usuario = db.query(models.UsuarioModel).filter(models.UsuarioModel.email == email).first()

    # Parece q msm se o email n existe evita lentidao, excluir isso dps 
    # Mas aqui é para o projeto, para facilitar testes
    if not usuario:
        raise HTTPException(status_code=404, detail="E-mail não encontrado.")

    # Token de reset (expira em 1 hora)
    token_reset = jwt.encode(
        {"sub": usuario.email, "tipo": "reset", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        str(SECRET_KEY), 
        algorithm=ALGORITHM
    )

    try:
        enviar_email_reset(usuario.email, usuario.nome, token_reset)
        return {"msg": "E-mail de recuperação enviado com sucesso!"}
    except Exception as e:
        print(f"Erro ao enviar reset: {e}")
        raise HTTPException(status_code=500, detail="Erro ao enviar e-mail.")

# Troca de senha
@app.post("/resetar-senha")
async def resetar_senha(dados: dict, db: Session = Depends(database.get_db)):
    token = dados.get("token")
    nova_senha = dados.get("password")

    try:
        payload = jwt.decode(token, str(SECRET_KEY), algorithms=[ALGORITHM])
        if payload.get("tipo") != "reset":
            raise HTTPException(status_code=400, detail="Token inválido para esta operação.")
        
        email = payload.get("sub")
        usuario = db.query(models.UsuarioModel).filter(models.UsuarioModel.email == email).first()

        if not usuario:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")

        # Hash da nova senha e salva
        usuario.password = pwd_context.hash(nova_senha)
        db.commit()

        return {"msg": "Senha alterada com sucesso! Já pode fazer login."}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=400, detail="O link de recuperação expirou.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=400, detail="Link de recuperação inválido.")


# Utilizando header para pegar o token (seguranca)
async def obter_usuario_logado(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token não fornecido")
    
    # Geralmente o token vem como "Bearer <token>"
    token = authorization.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, str(SECRET_KEY), algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        raise HTTPException(status_code=401, detail="Sessão inválida")

@app.post("/treinos")
async def criar_treino(treino: TreinoSchema, db: Session = Depends(database.get_db), authorization: str = Header(None)):
    email_usuario = await obter_usuario_logado(authorization)
    usuario = db.query(models.UsuarioModel).filter(models.UsuarioModel.email == email_usuario).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Cria o Treino
    novo_treino = models.TreinoModel(nome=treino.nome, usuario_id=usuario.id, dias_semana=treino.dias_semana, cor=treino.cor)
    db.add(novo_treino)
    db.commit()
    db.refresh(novo_treino)

    # Cria os Exercicios do treino
    for ex in treino.exercicios:
        novo_ex = models.ExercicioModel(
            nome=ex.nome,
            series=ex.series,
            repeticoes=ex.repeticoes,
            carga=ex.carga,
            treino_id=novo_treino.id
        )
        db.add(novo_ex)
    
    db.commit()
    return {"status": "sucesso", "msg": "Treino salvo com sucesso!"}

@app.get("/treinos")
async def listar_treinos(db: Session = Depends(database.get_db), authorization: str = Header(None)):
    email_usuario = await obter_usuario_logado(authorization)
    usuario = db.query(models.UsuarioModel).filter(models.UsuarioModel.email == email_usuario).first()

    return usuario.treinos

@app.delete("/treinos/{treino_id}")
async def excluir_treino(treino_id: int, db: Session = Depends(database.get_db), authorization: str = Header(None)):
    email = await obter_usuario_logado(authorization)
    treino = db.query(models.TreinoModel).filter(models.TreinoModel.id == treino_id).first()
    
    if not treino:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    db.delete(treino)
    db.commit()
    return {"msg": "Treino excluído"}

@app.put("/treinos/{treino_id}")
async def editar_treino(treino_id: int, treino_atualizado: TreinoSchema, db: Session = Depends(database.get_db), authorization: str = Header(None)):
    email = await obter_usuario_logado(authorization)
    usuario = db.query(models.UsuarioModel).filter(models.UsuarioModel.email == email).first()
    
    treino = db.query(models.TreinoModel).filter(models.TreinoModel.id == treino_id).first()
    if not treino: 
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    #Logica de Evolucao
    for ex_novo in treino_atualizado.exercicios:
        for ex_velho in treino.exercicios:
            if ex_novo.nome.strip().lower() == ex_velho.nome.strip().lower():
                if ex_novo.carga > ex_velho.carga:
                    nova_evolucao = models.EvolucaoModel(
                        usuario_id=usuario.id,
                        exercicio_nome=ex_novo.nome,
                        carga_anterior=ex_velho.carga,
                        carga_nova=ex_novo.carga,
                        data=datetime.now(timezone.utc)
                    )
                    db.add(nova_evolucao)

    treino.nome = treino_atualizado.nome
    treino.dias_semana = treino_atualizado.dias_semana 
    treino.cor = treino_atualizado.cor
    
    db.query(models.ExercicioModel).filter(models.ExercicioModel.treino_id == treino_id).delete()
    
    for ex in treino_atualizado.exercicios:
        novo_ex = models.ExercicioModel(**ex.model_dump(), treino_id=treino_id)
        db.add(novo_ex)
        
    db.commit()
    return {"msg": "Treino atualizado"}

@app.get("/evolucao")
async def listar_evolucao(db: Session = Depends(database.get_db), authorization: str = Header(None)):
    email = await obter_usuario_logado(authorization)
    usuario = db.query(models.UsuarioModel).filter(models.UsuarioModel.email == email).first()

    todas = db.query(models.EvolucaoModel).filter(
        models.EvolucaoModel.usuario_id == usuario.id
    ).order_by(models.EvolucaoModel.data.asc()).all()

    ultimas_evolucoes = {}
    for ev in todas:
        ultimas_evolucoes[ev.exercicio_nome] = {
            "exercicio": ev.exercicio_nome,
            "anterior": ev.carga_anterior,
            "atual": ev.carga_nova
        }

    return list(ultimas_evolucoes.values())