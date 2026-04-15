# models.py
from datetime import datetime
from .database import Base
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, DateTime
from sqlalchemy.orm import relationship

class UsuarioModel(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    ativo = Column(Boolean, default=False)

    treinos = relationship("TreinoModel", back_populates="dono", lazy="joined")

class TreinoModel(Base):
    __tablename__ = "treinos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String) # Ex: "Peito e Tríceps"
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    dias_semana = Column(String)
    cor = Column(String, default="#000000")

    dono = relationship("UsuarioModel", back_populates="treinos")
    exercicios = relationship("ExercicioModel", back_populates="treino", cascade="all, delete-orphan", lazy="joined")

class ExercicioModel(Base):
    __tablename__ = "exercicios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String) 
    series = Column(Integer)
    repeticoes = Column(String) 
    carga = Column(Float) 
    treino_id = Column(Integer, ForeignKey("treinos.id"))

    # Relacionamento
    treino = relationship("TreinoModel", back_populates="exercicios")

class EvolucaoModel(Base):
    __tablename__ = "evolucao_cargas"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    exercicio_nome = Column(String) # Guarda o nome para nao perder se o ex for deletado
    carga_anterior = Column(Float)
    carga_nova = Column(Float)
    data = Column(DateTime, default=datetime.now)

    dono = relationship("UsuarioModel")