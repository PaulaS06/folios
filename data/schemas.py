from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from datetime import date

DOMINIO_INSTITUCIONAL = "@soyudemedellin.edu.co"   # incluye la @ a propósito
MAX_BYTES_CONTRASENA = 72                          # límite de bcrypt (en bytes, no en caracteres)


# ---------- funciones auxiliares (se reutilizan en registro y login) ----------

def normalizar_correo(valor):
    """Quita espacios y pasa a minúsculas: 'Ana@X.co ' y 'ana@x.co' son el mismo correo."""
    if isinstance(valor, str):
        return valor.strip().lower()
    return valor


def limpiar_texto(valor):
    """Quita espacios al inicio y al final de un texto (si es texto)."""
    if isinstance(valor, str):
        return valor.strip()
    return valor


def validar_bytes_contrasena(valor: str) -> str:
    if len(valor.encode("utf-8")) > MAX_BYTES_CONTRASENA:
        raise ValueError(f"La contraseña es demasiado larga (máximo {MAX_BYTES_CONTRASENA} bytes).")
    return valor


# ---------- estudiantes ----------

class EstudianteRegistro(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    correo: EmailStr
    contrasena: str = Field(min_length=6)
    semestre: int = Field(ge=1, le=10)
    programa: str = Field(min_length=1)  # nombre del programa, ej: "Ingeniería de Sistemas"

    @field_validator("nombre", "programa", mode="before")
    @classmethod
    def _limpiar(cls, v):
        return limpiar_texto(v)

    @field_validator("correo", mode="before")
    @classmethod
    def _normalizar_correo(cls, v):
        return normalizar_correo(v)

    @field_validator("correo")
    @classmethod
    def _dominio_institucional(cls, v):
        if not v.endswith(DOMINIO_INSTITUCIONAL):
            raise ValueError(f"El correo debe ser institucional ({DOMINIO_INSTITUCIONAL}).")
        return v

    @field_validator("contrasena")
    @classmethod
    def _largo_contrasena(cls, v):
        return validar_bytes_contrasena(v)


class EstudianteLogin(BaseModel):
    correo: EmailStr
    contrasena: str = Field(min_length=1)

    @field_validator("correo", mode="before")
    @classmethod
    def _normalizar_correo(cls, v):
        return normalizar_correo(v)

    @field_validator("contrasena")
    @classmethod
    def _largo_contrasena(cls, v):
        return validar_bytes_contrasena(v)


class EstudianteRespuesta(BaseModel):
    """Lo que el backend devuelve de un estudiante. Nunca incluye la contraseña."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    correo: str
    semestre: int
    puntaje: int


class TokenRespuesta(BaseModel):
    access_token: str
    token_type: str = "bearer"
    estudiante: EstudianteRespuesta


# ---------- acciones (calificar y/o comentar) ----------

class AccionCrear(BaseModel):
    """Lo que envía el front al calificar/comentar.
    El estudiante (sesión) y el documento (URL) NO vienen aquí a propósito."""
    valor: float | None = Field(default=None, ge=1, le=5)
    comentario: str | None = None

    @field_validator("comentario", mode="before")
    @classmethod
    def _comentario_vacio_es_none(cls, v):
        v = limpiar_texto(v)
        return v or None

    @model_validator(mode="after")
    def _al_menos_uno(self):
        if self.valor is None and self.comentario is None:
            raise ValueError("Envía una calificación, un comentario, o ambos.")
        return self


class AccionRespuesta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    valor: float | None
    comentario: str | None
    fecha_calificacion: date
    id_estudiante: int
    id_documento: int