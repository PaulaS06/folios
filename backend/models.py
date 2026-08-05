from sqlalchemy import Column, Integer, String, Text, Date, Numeric, ForeignKey
from database import Base


class Programa(Base):
    __tablename__ = "programa"

    id = Column(Integer, primary_key = True)
    nombre = Column(String)
    facultad = Column(String)


class Estudiante(Base):
    __tablename__ = "estudiante"

    id = Column(Integer, primary_key = True)
    nombre = Column(String)
    correo = Column(String)
    contrasena = Column("contraseña", String)
    semestre = Column(Integer)
    puntaje = Column(Integer)
    id_programa = Column(Integer, ForeignKey("programa.id"))


class Materia(Base):
    __tablename__ = "materia"

    codigo = Column(Integer, primary_key = True)
    nombre = Column(String)
    id_programa = Column(Integer, ForeignKey("programa.id"))


class Categoria(Base):
    __tablename__ = "categoria"

    id = Column(Integer, primary_key = True)
    nombre = Column(String)


class Documento(Base):
    __tablename__ = "documento"

    id = Column(Integer, primary_key = True)
    nombre = Column(String)
    descripcion = Column(Text)
    enlace_archivo = Column(String)
    id_materia = Column(Integer, ForeignKey("materia.codigo"))
    id_estudiante = Column(Integer, ForeignKey("estudiante.id"))
    promedio_calificacion = Column(Numeric)
    fecha_subida = Column(Date)
    descargas_totales = Column(Integer)
    id_categoria = Column(Integer, ForeignKey("categoria.id"))