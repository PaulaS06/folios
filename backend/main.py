from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
from models import Estudiante, Programa
from pydantic import BaseModel, EmailStr
import bcrypt

app = FastAPI(title="Folios Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')


def verificar_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


class EstudianteRegistro(BaseModel):
    nombre: str
    correo: EmailStr
    password: str
    semestre: int
    programa: str  # nombre del programa, ej: "Ingeniería de Sistemas"


class EstudianteLogin(BaseModel):
    correo: EmailStr
    password: str


@app.post("/api/registro", status_code=status.HTTP_201_CREATED)
def registrar_estudiante(datos: EstudianteRegistro, db: Session = Depends(get_db)):
    ya_existe = db.query(Estudiante).filter(Estudiante.correo == datos.correo).first()

    if ya_existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )

    programa = db.query(Programa).filter(Programa.nombre == datos.programa).first()

    if not programa:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El programa académico no es válido."
        )

    hashed_password = get_password_hash(datos.password)

    nuevo_estudiante = Estudiante(
        nombre=datos.nombre,
        correo=datos.correo,
        contrasena=hashed_password,
        semestre=datos.semestre,
        puntaje=0,
        id_programa=programa.id
    )

    try:
        db.add(nuevo_estudiante)
        db.commit()
        return {"mensaje": "Cuenta creada exitosamente"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno al crear la cuenta: {str(e)}"
        )


@app.post("/api/login")
def iniciar_sesion(credenciales: EstudianteLogin, db: Session = Depends(get_db)):
    estudiante = db.query(Estudiante).filter(Estudiante.correo == credenciales.correo).first()

    if not estudiante or not verificar_password(credenciales.password, estudiante.contrasena):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos."
        )

    return {
        "mensaje": "Inicio de sesión exitoso",
        "id": estudiante.id,
        "nombre": estudiante.nombre
    }