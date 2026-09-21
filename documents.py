from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from data.database import get_db
from data.models import Documento, Materia, Categoria, Estudiante
from data.schemas import DocumentoCrear, DocumentoRespuesta
from dependencies import estudiante_actual

router = APIRouter(prefix="/api/documentos", tags=["Documentos"])

# Colombia no tiene horario de verano: UTC-5 todo el año.
ZONA_COLOMBIA = timezone(timedelta(hours=-5))


def hoy_colombia():
    """Fecha de hoy en Colombia. Con CURRENT_DATE de la BD (que va en UTC),
    una publicación hecha a las 9 p. m. quedaría con la fecha de mañana."""
    return datetime.now(ZONA_COLOMBIA).date()


def armar_respuesta(documento, materia, categoria, autor):
    """Convierte un documento (más los nombres de su materia, categoría y autor)
    en lo que devuelve la API. Se reutilizará en el listado y en el detalle."""
    return {
        "id": documento.id,
        "nombre": documento.nombre,
        "descripcion": documento.descripcion,
        "enlace": documento.enlace_archivo,
        "id_materia": documento.id_materia,
        "materia": materia,
        "id_categoria": documento.id_categoria,
        "categoria": categoria,
        "id_autor": documento.id_estudiante,
        "autor": autor,
        "fecha": documento.fecha_subida,
        "calificacion": float(documento.promedio_calificacion or 0),
    }


@router.post("", response_model=DocumentoRespuesta, status_code=status.HTTP_201_CREATED)
def publicar_documento(
    datos: DocumentoCrear,
    estudiante: Estudiante = Depends(estudiante_actual),
    db: Session = Depends(get_db),
):
    # Pydantic ya validó forma, largos y el esquema del enlace.
    # Lo que queda es comprobar que la materia y la categoría existan.
    materia = db.get(Materia, datos.id_materia)
    if materia is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La materia no existe.")

    categoria = db.get(Categoria, datos.id_categoria)
    if categoria is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La categoría no existe.")

    documento = Documento(
        nombre=datos.nombre,
        descripcion=datos.descripcion,
        enlace_archivo=datos.enlace,
        id_materia=materia.codigo,
        id_categoria=categoria.id,
        id_estudiante=estudiante.id,      # el autor sale del token, nunca del cuerpo
        fecha_subida=hoy_colombia(),
        promedio_calificacion=0,
        descargas_totales=0,
    )
    db.add(documento)
    db.commit()
    db.refresh(documento)

    return armar_respuesta(documento, materia.nombre, categoria.nombre, estudiante.nombre)


def escapar_like(texto: str) -> str:
    """% y _ son comodines de LIKE: si el usuario busca "100%" debe buscarse ese
    texto, no "100 seguido de cualquier cosa". Se marcan con ! como escape."""
    return texto.replace("!", "!!").replace("%", "!%").replace("_", "!_")


def sin_tildes(valor):
    """unaccent (extensión de PostgreSQL): 'Cálculo' -> 'Calculo', para que
    buscar 'calculo' encuentre 'Cálculo'."""
    return func.unaccent(valor)


@router.get("", response_model=list[DocumentoRespuesta])
def listar_documentos(
    q: str | None = Query(default=None, max_length=100),
    materia: int | None = Query(default=None, ge=1),
    categoria: int | None = Query(default=None, ge=1),
    estudiante: Estudiante = Depends(estudiante_actual),   # solo estudiantes con sesión
    db: Session = Depends(get_db),
):
    consulta = (
        select(Documento, Materia.nombre, Categoria.nombre, Estudiante.nombre)
        .join(Materia, Materia.codigo == Documento.id_materia)
        .join(Categoria, Categoria.id == Documento.id_categoria)
        .join(Estudiante, Estudiante.id == Documento.id_estudiante)
        .order_by(Documento.fecha_subida.desc(), Documento.id.desc())   # más recientes primero
    )

    # Cada filtro es opcional y se combinan con AND (RF-05, CA_03)
    if materia is not None:
        consulta = consulta.where(Documento.id_materia == materia)
    if categoria is not None:
        consulta = consulta.where(Documento.id_categoria == categoria)

    texto = (q or "").strip()
    if texto:
        # Texto libre sobre nombre del documento, materia o autor.
        # Los valores viajan como parámetros: lo que escriba el usuario no puede inyectar SQL.
        patron = sin_tildes(f"%{escapar_like(texto)}%")
        consulta = consulta.where(or_(
            sin_tildes(Documento.nombre).ilike(patron, escape="!"),
            sin_tildes(Materia.nombre).ilike(patron, escape="!"),
            sin_tildes(Estudiante.nombre).ilike(patron, escape="!"),
        ))

    filas = db.execute(consulta).all()
    return [
        armar_respuesta(documento, nombre_materia, nombre_categoria, nombre_autor)
        for documento, nombre_materia, nombre_categoria, nombre_autor in filas
    ]