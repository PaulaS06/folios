from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
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