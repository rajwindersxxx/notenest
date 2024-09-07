--
-- PostgreSQL database dump
--database notebook

-- Dumped from database version 16.3
-- Dumped by pg_dump version 16.3

-- Started on 2024-09-07 12:47:51

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 24601)
-- Name: notebook; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notebook (
    id integer NOT NULL,
    book_title text,
    isbn_code character varying(20),
    rating character varying(10),
    book_url text,
    note text,
    summary text,
    date date,
    user_id integer NOT NULL
);


ALTER TABLE public.notebook OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 24600)
-- Name: notebook_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notebook_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notebook_id_seq OWNER TO postgres;

--
-- TOC entry 4847 (class 0 OID 0)
-- Dependencies: 215
-- Name: notebook_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notebook_id_seq OWNED BY public.notebook.id;


--
-- TOC entry 218 (class 1259 OID 24610)
-- Name: notebook_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notebook_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notebook_user_id_seq OWNER TO postgres;

--
-- TOC entry 4848 (class 0 OID 0)
-- Dependencies: 218
-- Name: notebook_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notebook_user_id_seq OWNED BY public.notebook.user_id;


--
-- TOC entry 217 (class 1259 OID 24607)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    first_name character varying(30),
    last_name character varying(30),
    email character varying(30),
    password character varying(255),
    id integer NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24617)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 4849 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4694 (class 2604 OID 24604)
-- Name: notebook id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notebook ALTER COLUMN id SET DEFAULT nextval('public.notebook_id_seq'::regclass);


--
-- TOC entry 4695 (class 2604 OID 24611)
-- Name: notebook user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notebook ALTER COLUMN user_id SET DEFAULT nextval('public.notebook_user_id_seq'::regclass);


--
-- TOC entry 4696 (class 2604 OID 24618)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 4698 (class 2606 OID 24620)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


-- Completed on 2024-09-07 12:47:51

--
-- PostgreSQL database dump complete
--

