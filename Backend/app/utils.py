import smtplib
import os
from dotenv import load_dotenv
from email.message import EmailMessage

def enviar_email_confirmacao(email_destino, nome_usuario, token):
    load_dotenv()
    remetente = os.getenv("EMAIL_USER")
    senha = os.getenv("EMAIL_PASSWORD")

    msg = EmailMessage()
    msg['Subject'] = "Confirme seu cadastro no Workout Info!"
    msg['From'] = remetente
    msg['To'] = email_destino

    conteudo = f"""
    Olá {nome_usuario},
    
    Para ativar sua conta no Workout Info, clique no link abaixo:
    http://localhost:5173/confirmar/{token}
    """
    msg.set_content(conteudo)

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(remetente, senha)
        smtp.send_message(msg)

def enviar_email_reset(email_destino, nome_usuario, token):
    load_dotenv()
    remetente = os.getenv("EMAIL_USER")
    senha = os.getenv("EMAIL_PASSWORD")

    msg = EmailMessage()
    msg['Subject'] = "Recuperação de Senha - Workout Info"
    msg['From'] = remetente
    msg['To'] = email_destino

    # URL que o usuario vai clicar 
    link = f"http://localhost:5173/reset-password/{token}"

    conteudo = f"""
    Olá {nome_usuario},
    
    Você solicitou a recuperação de senha para sua conta no Workout Info.
    Clique no link abaixo para cadastrar uma nova senha:
    
    {link}
    
    Se não foi você quem solicitou, ignore este e-mail.
    """
    msg.set_content(conteudo)

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
        smtp.login(remetente, senha)
        smtp.send_message(msg)