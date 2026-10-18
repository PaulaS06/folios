--
-- PostgreSQL database dump
--

\restrict l9rnUfzS8jc1v3PqALfqHSAIj4pann2mK3VOyzo1pDfSEwFxP2MytiQbEvBkdAH

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
-- Data for Name: categoria; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categoria (id, nombre) FROM stdin;
1	Apunte de clase
2	Resumen
3	Parcial antiguo
4	Taller
5	Laboratorio
\.


--
-- Data for Name: programa; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.programa (id, nombre, facultad) FROM stdin;
1	Ingeniería de Sistemas	Facultad de Ingenierías
2	Ingeniería Financiera	Facultad de Ingenierías
3	Ingeniería Civil	Facultad de Ingenierías
4	Ingeniería Industrial	Facultad de Ingenierías
5	Computación Científica	Facultad de Ingenierías
\.


--
-- Data for Name: materia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.materia (codigo, nombre, id_programa) FROM stdin;
1	Investigación de Operaciones	1
2	Análisis Numérico	1
3	Análisis y Diseño de Algoritmos	1
4	Estructuras de Datos	1
5	Estadística para Ingeniería	2
6	Formulación y Evaluación de Proyectos	2
7	Cálculo Diferencial	5
8	Cálculo de Varias Variables	5
9	Ecuaciones Diferenciales	5
10	Física 2	5
\.


--
-- Name: categoria_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categoria_id_seq', 5, true);


--
-- Name: materia_codigo_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.materia_codigo_seq', 10, true);


--
-- Name: programa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.programa_id_seq', 5, true);


--
-- PostgreSQL database dump complete
--

\unrestrict l9rnUfzS8jc1v3PqALfqHSAIj4pann2mK3VOyzo1pDfSEwFxP2MytiQbEvBkdAH

