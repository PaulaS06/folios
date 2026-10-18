--
-- PostgreSQL database dump
--

\restrict kqzq2lrRaZl7mUr9o16VUf4j8JgP0hQbZhKNvpdg5xhCij0lZBgWWguFmq0BHaX

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11 (Debian 17.11-1.pgdg13+2)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: actualizar_promedio(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_promedio() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    promedio_notas DECIMAL;
    id_doc INT;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        id_doc := OLD.id_documento;
    ELSE
        id_doc := NEW.id_documento;
    END IF;

    SELECT ROUND(AVG(valor), 2) INTO promedio_notas
    FROM accion
    WHERE id_documento = id_doc AND valor IS NOT NULL;

    UPDATE documento
    SET promedio_calificacion = COALESCE(promedio_notas, 0)
    WHERE id = id_doc;

    RETURN NEW;
END;
$$;


--
-- Name: actualizar_puntaje(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.actualizar_puntaje() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    autor_documento INT;
    diferencia INT;
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.valor IS NOT DISTINCT FROM NEW.valor THEN
        RETURN NEW;   -- la calificación no cambió (p. ej. solo se editó el comentario)
    END IF;

    SELECT id_estudiante INTO autor_documento
    FROM documento WHERE id = NEW.id_documento;

    -- Revierte el efecto de la calificación anterior (0 si es un INSERT) y
    -- aplica el de la nueva, en la misma operación.
    diferencia := puntos_por_calificacion(NEW.valor)
                - CASE WHEN TG_OP = 'UPDATE' THEN puntos_por_calificacion(OLD.valor) ELSE 0 END;

    UPDATE estudiante
    SET puntaje = GREATEST(puntaje + diferencia, 0)   -- nunca queda negativo (chk_estudiante_puntaje)
    WHERE id = autor_documento;

    RETURN NEW;
END;
$$;


--
-- Name: puntos_por_calificacion(numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.puntos_por_calificacion(nota numeric) RETURNS integer
    LANGUAGE plpgsql IMMUTABLE
    AS $$
BEGIN
    IF nota IS NULL THEN RETURN 0;
    ELSIF nota >= 1 AND nota < 2 THEN RETURN -5;
    ELSIF nota >= 2 AND nota < 3 THEN RETURN -3;
    ELSIF nota >= 3 AND nota < 4 THEN RETURN 3;
    ELSIF nota >= 4 AND nota <= 5 THEN RETURN 5;
    ELSE RETURN 0;
    END IF;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accion (
    id integer NOT NULL,
    valor numeric(2,1),
    comentario text,
    fecha_calificacion date DEFAULT CURRENT_DATE NOT NULL,
    id_estudiante integer NOT NULL,
    id_documento integer NOT NULL,
    CONSTRAINT chk_accion_valor CHECK (((valor IS NULL) OR ((valor >= (1)::numeric) AND (valor <= (5)::numeric))))
);


--
-- Name: accion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accion_id_seq OWNED BY public.accion.id;


--
-- Name: categoria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categoria (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


--
-- Name: categoria_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categoria_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categoria_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categoria_id_seq OWNED BY public.categoria.id;


--
-- Name: documento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documento (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    descripcion text,
    enlace_archivo character varying(255) NOT NULL,
    id_materia integer NOT NULL,
    id_estudiante integer NOT NULL,
    promedio_calificacion numeric(2,1) DEFAULT 0,
    fecha_subida date DEFAULT CURRENT_DATE NOT NULL,
    descargas_totales integer DEFAULT 0 NOT NULL,
    id_categoria integer NOT NULL,
    CONSTRAINT chk_documento_descargas CHECK ((descargas_totales >= 0)),
    CONSTRAINT chk_documento_promedio CHECK (((promedio_calificacion >= (0)::numeric) AND (promedio_calificacion <= (5)::numeric)))
);


--
-- Name: documento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: documento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documento_id_seq OWNED BY public.documento.id;


--
-- Name: estudiante; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estudiante (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    correo character varying(100) NOT NULL,
    "contraseña" character varying(100) NOT NULL,
    semestre integer NOT NULL,
    puntaje integer DEFAULT 0 NOT NULL,
    id_programa integer NOT NULL,
    CONSTRAINT chk_estudiante_puntaje CHECK ((puntaje >= 0)),
    CONSTRAINT chk_estudiante_semestre CHECK ((semestre > 0))
);


--
-- Name: estudiante_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.estudiante_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estudiante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.estudiante_id_seq OWNED BY public.estudiante.id;


--
-- Name: materia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materia (
    codigo integer NOT NULL,
    nombre character varying(100) NOT NULL,
    id_programa integer NOT NULL
);


--
-- Name: materia_codigo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.materia_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: materia_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.materia_codigo_seq OWNED BY public.materia.codigo;


--
-- Name: programa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.programa (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    facultad character varying(100) NOT NULL
);


--
-- Name: programa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.programa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: programa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.programa_id_seq OWNED BY public.programa.id;


--
-- Name: accion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accion ALTER COLUMN id SET DEFAULT nextval('public.accion_id_seq'::regclass);


--
-- Name: categoria id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria ALTER COLUMN id SET DEFAULT nextval('public.categoria_id_seq'::regclass);


--
-- Name: documento id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento ALTER COLUMN id SET DEFAULT nextval('public.documento_id_seq'::regclass);


--
-- Name: estudiante id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiante ALTER COLUMN id SET DEFAULT nextval('public.estudiante_id_seq'::regclass);


--
-- Name: materia codigo; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia ALTER COLUMN codigo SET DEFAULT nextval('public.materia_codigo_seq'::regclass);


--
-- Name: programa id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programa ALTER COLUMN id SET DEFAULT nextval('public.programa_id_seq'::regclass);


--
-- Name: accion accion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accion
    ADD CONSTRAINT accion_pkey PRIMARY KEY (id);


--
-- Name: categoria categoria_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_nombre_key UNIQUE (nombre);


--
-- Name: categoria categoria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria
    ADD CONSTRAINT categoria_pkey PRIMARY KEY (id);


--
-- Name: documento documento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT documento_pkey PRIMARY KEY (id);


--
-- Name: estudiante estudiante_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiante
    ADD CONSTRAINT estudiante_correo_key UNIQUE (correo);


--
-- Name: estudiante estudiante_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiante
    ADD CONSTRAINT estudiante_pkey PRIMARY KEY (id);


--
-- Name: materia materia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia
    ADD CONSTRAINT materia_pkey PRIMARY KEY (codigo);


--
-- Name: programa programa_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programa
    ADD CONSTRAINT programa_nombre_key UNIQUE (nombre);


--
-- Name: programa programa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.programa
    ADD CONSTRAINT programa_pkey PRIMARY KEY (id);


--
-- Name: accion uq_accion_estudiante_documento; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accion
    ADD CONSTRAINT uq_accion_estudiante_documento UNIQUE (id_estudiante, id_documento);


--
-- Name: materia_nombre_programa_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX materia_nombre_programa_key ON public.materia USING btree (nombre, id_programa);


--
-- Name: accion trigg_actualizar_promedio; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigg_actualizar_promedio AFTER INSERT OR UPDATE ON public.accion FOR EACH ROW EXECUTE FUNCTION public.actualizar_promedio();


--
-- Name: accion trigg_actualizar_puntaje; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigg_actualizar_puntaje AFTER INSERT OR UPDATE ON public.accion FOR EACH ROW EXECUTE FUNCTION public.actualizar_puntaje();


--
-- Name: accion fk_accion_documento; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accion
    ADD CONSTRAINT fk_accion_documento FOREIGN KEY (id_documento) REFERENCES public.documento(id) ON DELETE CASCADE;


--
-- Name: accion fk_accion_estudiante; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accion
    ADD CONSTRAINT fk_accion_estudiante FOREIGN KEY (id_estudiante) REFERENCES public.estudiante(id);


--
-- Name: documento fk_documento_categoria; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT fk_documento_categoria FOREIGN KEY (id_categoria) REFERENCES public.categoria(id);


--
-- Name: documento fk_documento_estudiante; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT fk_documento_estudiante FOREIGN KEY (id_estudiante) REFERENCES public.estudiante(id);


--
-- Name: documento fk_documento_materia; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documento
    ADD CONSTRAINT fk_documento_materia FOREIGN KEY (id_materia) REFERENCES public.materia(codigo);


--
-- Name: estudiante fk_estudiante_programa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estudiante
    ADD CONSTRAINT fk_estudiante_programa FOREIGN KEY (id_programa) REFERENCES public.programa(id);


--
-- Name: materia fk_materia_programa; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materia
    ADD CONSTRAINT fk_materia_programa FOREIGN KEY (id_programa) REFERENCES public.programa(id);


--
-- Name: accion; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.accion ENABLE ROW LEVEL SECURITY;

--
-- Name: categoria; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categoria ENABLE ROW LEVEL SECURITY;

--
-- Name: documento; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documento ENABLE ROW LEVEL SECURITY;

--
-- Name: estudiante; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.estudiante ENABLE ROW LEVEL SECURITY;

--
-- Name: materia; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.materia ENABLE ROW LEVEL SECURITY;

--
-- Name: programa; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.programa ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict kqzq2lrRaZl7mUr9o16VUf4j8JgP0hQbZhKNvpdg5xhCij0lZBgWWguFmq0BHaX