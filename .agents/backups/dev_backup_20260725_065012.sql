--
-- PostgreSQL database dump
--

\restrict FAvHvFRxLAT4HnezsK3vKh46kcZo6fhWQZqbXv8gOjz5EHI7LP9IXpICE1c97Ps

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

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
-- Name: competitions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.competitions (
    id integer NOT NULL,
    name text NOT NULL,
    type text
);


--
-- Name: competitions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.competitions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: competitions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.competitions_id_seq OWNED BY public.competitions.id;


--
-- Name: league_positions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.league_positions (
    id integer NOT NULL,
    year text NOT NULL,
    league text NOT NULL,
    "position" integer,
    matches integer DEFAULT 0 NOT NULL,
    wins integer DEFAULT 0 NOT NULL,
    draws integer DEFAULT 0 NOT NULL,
    losses integer DEFAULT 0 NOT NULL,
    goals_for integer DEFAULT 0 NOT NULL,
    goals_against integer DEFAULT 0 NOT NULL,
    points integer DEFAULT 0 NOT NULL
);


--
-- Name: league_positions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.league_positions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: league_positions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.league_positions_id_seq OWNED BY public.league_positions.id;


--
-- Name: managers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.managers (
    id integer NOT NULL,
    name text NOT NULL,
    nationality text,
    start_year integer,
    end_year integer,
    seasons text,
    stored_games integer,
    stored_wins integer,
    stored_draws integer,
    stored_losses integer,
    stored_goals_for integer,
    stored_goals_against integer
);


--
-- Name: managers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.managers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: managers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.managers_id_seq OWNED BY public.managers.id;


--
-- Name: matches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matches (
    id integer NOT NULL,
    match_date date NOT NULL,
    season text NOT NULL,
    opponent_id integer NOT NULL,
    goals_for integer NOT NULL,
    goals_against integer NOT NULL,
    result text NOT NULL,
    home_away text NOT NULL,
    competition_id integer NOT NULL,
    stadium_id integer,
    manager_id integer,
    attendance integer,
    scorers text
);


--
-- Name: matches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.matches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: matches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.matches_id_seq OWNED BY public.matches.id;


--
-- Name: opponents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.opponents (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: opponents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.opponents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: opponents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.opponents_id_seq OWNED BY public.opponents.id;


--
-- Name: player_season_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_season_stats (
    id integer NOT NULL,
    player_id integer NOT NULL,
    season text NOT NULL,
    appearances integer DEFAULT 0 NOT NULL,
    goals integer DEFAULT 0 NOT NULL,
    assists integer DEFAULT 0 NOT NULL
);


--
-- Name: player_season_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.player_season_stats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: player_season_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.player_season_stats_id_seq OWNED BY public.player_season_stats.id;


--
-- Name: players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.players (
    id integer NOT NULL,
    name text NOT NULL,
    "position" text,
    nationality text,
    birth_year integer
);


--
-- Name: players_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.players_id_seq OWNED BY public.players.id;


--
-- Name: season_top_scorers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.season_top_scorers (
    id integer NOT NULL,
    season text NOT NULL,
    player_name text NOT NULL,
    goals integer NOT NULL,
    verified boolean DEFAULT true NOT NULL
);


--
-- Name: season_top_scorers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.season_top_scorers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: season_top_scorers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.season_top_scorers_id_seq OWNED BY public.season_top_scorers.id;


--
-- Name: stadiums; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stadiums (
    id integer NOT NULL,
    name text NOT NULL,
    city text,
    capacity integer
);


--
-- Name: stadiums_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.stadiums_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: stadiums_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.stadiums_id_seq OWNED BY public.stadiums.id;


--
-- Name: competitions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitions ALTER COLUMN id SET DEFAULT nextval('public.competitions_id_seq'::regclass);


--
-- Name: league_positions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.league_positions ALTER COLUMN id SET DEFAULT nextval('public.league_positions_id_seq'::regclass);


--
-- Name: managers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.managers ALTER COLUMN id SET DEFAULT nextval('public.managers_id_seq'::regclass);


--
-- Name: matches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches ALTER COLUMN id SET DEFAULT nextval('public.matches_id_seq'::regclass);


--
-- Name: opponents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opponents ALTER COLUMN id SET DEFAULT nextval('public.opponents_id_seq'::regclass);


--
-- Name: player_season_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_season_stats ALTER COLUMN id SET DEFAULT nextval('public.player_season_stats_id_seq'::regclass);


--
-- Name: players id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players ALTER COLUMN id SET DEFAULT nextval('public.players_id_seq'::regclass);


--
-- Name: season_top_scorers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.season_top_scorers ALTER COLUMN id SET DEFAULT nextval('public.season_top_scorers_id_seq'::regclass);


--
-- Name: stadiums id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stadiums ALTER COLUMN id SET DEFAULT nextval('public.stadiums_id_seq'::regclass);


--
-- Data for Name: competitions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.competitions (id, name, type) FROM stdin;
1	Campeonato Brasileiro Série A	league
2	Campeonato Brasileiro Série B	league
3	Campeonato Brasileiro Série C	league
4	Copa do Brasil	cup
5	Campeonato Alagoano	state
6	Copa do Nordeste	regional
8	Campeonato Brasileiro Série D	league
12	Copa Alagoas	state
15	Copa Alagipe	regional
14	Campeonato Alagoano 2ª Divisão	state
\.


--
-- Data for Name: league_positions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.league_positions (id, year, league, "position", matches, wins, draws, losses, goals_for, goals_against, points) FROM stdin;
1	2024	Campeonato Brasileiro Série C	\N	20	11	4	5	32	18	37
2	2023	Campeonato Brasileiro Série C	\N	20	10	5	5	28	16	35
3	2022	Campeonato Brasileiro Série C	\N	20	9	4	7	26	22	31
4	2021	Campeonato Brasileiro Série B	17	38	10	9	19	35	53	39
5	2020	Campeonato Brasileiro Série B	11	38	14	9	15	43	48	51
6	2019	Campeonato Brasileiro Série A	16	38	11	9	18	40	59	42
7	2018	Campeonato Brasileiro Série C	1	22	18	2	2	52	12	56
8	2017	Campeonato Brasileiro Série B	14	38	12	10	16	43	52	46
9	2016	Campeonato Brasileiro Série C	3	20	10	5	5	32	20	35
10	2015	Campeonato Brasileiro Série C	8	20	8	5	7	28	24	29
11	2014	Campeonato Brasileiro Série D	1	18	14	2	2	40	10	44
12	2013	Campeonato Brasileiro Série D	4	18	10	4	4	30	18	34
13	2012	Campeonato Brasileiro Série D	6	18	8	5	5	25	22	29
14	2011	Campeonato Brasileiro Série D	5	18	9	3	6	28	20	30
15	2010	Campeonato Brasileiro Série C	12	20	6	5	9	22	30	23
16	2009	Campeonato Brasileiro Série C	9	20	7	4	9	24	28	25
17	2008	Campeonato Brasileiro Série C	7	20	8	4	8	26	26	28
18	2007	Campeonato Brasileiro Série C	11	20	6	6	8	22	28	24
19	2006	Campeonato Brasileiro Série C	14	20	5	5	10	19	32	20
20	2005	Campeonato Brasileiro Série C	10	20	7	4	9	22	28	25
\.


--
-- Data for Name: managers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.managers (id, name, nationality, start_year, end_year, seasons, stored_games, stored_wins, stored_draws, stored_losses, stored_goals_for, stored_goals_against) FROM stdin;
2	Argel Fuchs	Brasileiro	2019	2020	2019,2020	30	7	6	17	23	43
3	Marcelo Cabo	Brasileiro	2018	2024	2018,2019,2024	98	37	32	29	114	91
4	Mozart Santos	Brasileiro	2020	2022	2020,2021,2022	98	45	34	19	149	78
5	Roberto Fernandes	Brasileiro	2022	2022	2022	12	3	4	5	9	12
10	Higo Magalhães	Brasileiro	2024	2025	2024,2025	55	24	16	15	74	52
14	Nêdo Xavier	Brasileiro	2015	2015	2015	15	4	5	6	13	13
19	Oliveira Canindé	Brasileiro	2014	2017	2014,2017	73	40	14	19	124	65
20	Lino	Brasileiro	2009	2014	2009,2010,2011,2014	46	25	8	13	89	58
21	Lorival Santos	Brasileiro	2009	2013	2009,2013	32	18	8	6	53	28
22	Freitas Nascimento	Brasileiro	1994	2009	1994,1995,2009	32	14	5	13	48	41
23	Beto Almeida	Brasileiro	2013	2013	2013	23	8	7	8	29	30
24	Pinho	Brasileiro	2000	2000	2000	22	13	3	6	43	22
25	Vinícius Bergantin	Brasileiro	2023	2023	2023	21	8	8	5	22	16
26	Heriberto da Cunha	Brasileiro	2002	2002	2002	21	10	7	4	36	29
27	Ney da Matta	Brasileiro	2017	2017	2017	19	10	7	2	25	11
28	Celso Teixeira	Brasileiro	1999	2012	1999,2009,2012	19	5	5	9	19	23
29	Moacir Júnior	Brasileiro	2026	2026	2026	17	10	5	2	40	12
30	Cláudio Adão	Brasileiro	2001	2001	2001	17	6	3	8	22	26
31	Agnaldo Liz	Brasileiro	2006	2006	2006	16	9	4	3	26	14
32	Eduardo Baptista	Brasileiro	2020	2020	2020	15	6	1	8	17	14
33	Flávio Araújo	Brasileiro	2017	2018	2017,2018	14	6	5	3	17	11
34	Laerte Dória	Brasileiro	1980	1980	1980	13	8	2	3	20	15
35	Adriano Rodrigues	Brasileiro	2020	2022	2020,2021,2022	12	6	3	3	15	13
36	Itamar Schülle	Brasileiro	2026	2026	2026	12	6	2	4	14	8
37	Bruno Pivetti	Brasileiro	2021	2021	2021	12	3	5	4	10	9
38	Ney Franco	Brasileiro	2021	2021	2021	12	5	2	5	12	10
39	Valmir Louruz	Brasileiro	1981	1986	1981,1983,1986	12	4	3	5	18	15
40	Alberto Valentim	Brasileiro	2022	2022	2022	11	2	4	5	7	12
41	Otávio Quadros	Brasileiro	1999	2000	1999,2000	11	6	2	3	20	11
42	Ubirajara Veiga	Brasileiro	2002	2002	2002	10	4	2	4	15	17
43	Cristian Souza	Brasileiro	2024	2024	2024	10	3	4	3	15	17
44	Bebeto Moraes	Brasileiro	2023	2024	2023,2024	10	3	3	4	7	10
45	Flávio Barros	Brasileiro	2008	2009	2008,2009	9	4	4	1	15	10
46	Roberto Fonseca	Brasileiro	2023	2023	2023	9	3	3	3	11	8
47	Luiz Felipe Scolari	Brasileiro	1982	1982	1982	8	1	4	3	10	17
48	Marcos Magalhães	Brasileiro	2006	2006	2006	8	4	2	2	15	8
49	Zé do Carmo	Brasileiro	2008	2008	2008	8	4	2	2	14	9
50	Orlando Peçanha	Brasileiro	1977	1977	1977	8	2	3	3	6	7
51	Bagé	Brasileiro	2015	2015	2015	7	2	3	2	7	8
52	Mario Juliatto	Brasileiro	2002	2002	2002	6	4	1	1	15	5
53	Mário Tilico	Brasileiro	2011	2011	2011	6	2	0	4	8	12
54	Hugo Sales	Brasileiro	2009	2009	2009	6	3	1	2	10	10
55	Mauricio Barbieri	Brasileiro	2020	2020	2020	6	2	1	3	7	9
56	Edson Ferreira	Brasileiro	2011	2011	2011	6	1	0	5	6	12
57	Círio Quadros	Brasileiro	2012	2012	2012	6	3	2	1	11	2
58	Júlio Espinosa	Brasileiro	2009	2009	2009	5	1	1	3	5	9
59	Gilmar Batista	Brasileiro	2009	2009	2009	5	2	0	3	5	11
60	Estevam Soares	Brasileiro	2001	2014	2001,2014	5	1	2	2	5	5
61	Jacozinho	Brasileiro	2017	2019	2017,2019	4	0	1	3	3	8
62	Gil Baiano	Brasileiro	2008	2008	2008	4	1	0	3	2	6
63	Gilberto Pereira	Brasileiro	2006	2006	2006	4	2	1	1	7	6
64	Márcio Fernandes	Brasileiro	2025	2025	2025	4	1	1	2	3	5
65	Jorge Vasconcelos	Brasileiro	1982	1982	1982	3	1	0	2	5	8
66	Roberval Davino	Brasileiro	1996	2008	1996,2008	3	1	0	2	11	4
67	Rogério Corrêa	Brasileiro	2024	2024	2024	2	1	1	0	2	1
68	Marlon Araújo	Brasileiro	2014	2014	2014	2	0	0	2	0	4
69	Levi Gomes	Brasileiro	1998	1998	1998	2	0	0	2	0	4
70	Rodrigo Ramos	Brasileiro	2026	2026	2026	2	2	0	0	7	1
71	Denis Iwamura	Brasileiro	2022	2022	2022	2	2	0	0	8	0
72	Dorian Junior	Brasileiro	2023	2023	2023	2	0	1	1	0	1
73	Mauro Fernandes	Brasileiro	1991	1991	1991	2	1	0	1	1	1
74	Laelson Lopes	Brasileiro	2002	2002	2002	1	0	0	1	0	2
75	Lauro Martins	Brasileiro	2025	2025	2025	1	1	0	0	2	1
76	Márcio Goiano	Brasileiro	2020	2020	2020	1	0	0	1	1	2
77	Valdemar Carabina	Brasileiro	1985	1985	1985	1	1	0	0	4	0
78	Robertinho	Brasileiro	2003	2003	2003	1	0	0	1	1	2
79	Alberto Meneses	Brasileiro	1981	1981	1981	1	1	0	0	1	0
80	Lucio Flavio	Brasileiro	2021	2021	2021	1	0	0	1	0	2
\.


--
-- Data for Name: matches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.matches (id, match_date, season, opponent_id, goals_for, goals_against, result, home_away, competition_id, stadium_id, manager_id, attendance, scorers) FROM stdin;
921	2019-01-15	2019	5	1	1	draw	home	6	1	3	\N	\N
922	2019-01-28	2019	7	0	0	draw	away	6	\N	3	\N	\N
923	2019-02-03	2019	38	3	0	win	away	6	\N	3	\N	\N
924	2019-02-17	2019	87	1	0	win	home	6	1	3	\N	\N
925	2019-03-07	2019	1	0	0	draw	home	6	1	3	\N	\N
926	2019-03-10	2019	4	1	1	draw	away	6	\N	3	\N	\N
927	2019-03-24	2019	97	2	0	win	home	6	1	3	\N	\N
928	2019-03-30	2019	82	2	1	win	away	6	\N	3	\N	\N
929	2019-04-07	2019	9	1	3	loss	away	6	\N	3	\N	\N
930	2019-01-20	2019	89	0	1	loss	away	5	\N	3	\N	\N
931	2019-01-23	2019	46	3	0	win	home	5	1	3	\N	\N
932	2019-01-31	2019	44	2	1	win	home	5	1	3	\N	\N
933	2019-02-10	2019	1	0	0	draw	away	5	\N	3	\N	\N
934	2019-02-24	2019	85	1	0	win	home	5	1	3	\N	\N
935	2019-03-13	2019	42	3	1	win	home	5	1	3	\N	\N
936	2019-03-17	2019	45	1	1	draw	away	5	\N	3	\N	\N
937	2019-03-27	2019	45	6	2	win	away	5	\N	3	\N	\N
938	2019-04-03	2019	45	1	1	draw	home	5	1	3	\N	\N
939	2019-04-14	2019	1	1	0	win	home	5	1	3	\N	\N
940	2019-04-21	2019	1	0	1	loss	away	5	\N	3	\N	\N
941	2019-02-06	2019	98	0	1	loss	away	4	\N	3	\N	\N
1448	2011-04-02	2011	1	1	0	win	away	5	\N	\N	\N	\N
1449	2011-03-27	2011	43	2	0	win	home	5	\N	\N	\N	\N
1450	2011-03-23	2011	44	0	0	draw	away	5	\N	\N	\N	\N
1451	2011-03-20	2011	78	3	0	win	home	5	\N	\N	\N	\N
1452	2011-03-16	2011	42	0	3	loss	away	5	\N	\N	\N	\N
1453	2011-03-12	2011	45	0	1	loss	away	5	\N	\N	\N	\N
1454	2011-03-02	2011	132	1	3	loss	home	5	\N	\N	\N	\N
1455	2011-02-27	2011	131	0	1	loss	away	5	\N	\N	\N	\N
1456	2011-02-20	2011	77	5	3	win	home	5	\N	\N	\N	\N
1457	2011-02-13	2011	77	0	1	loss	away	5	\N	\N	\N	\N
1458	2011-02-09	2011	131	1	3	loss	home	5	\N	\N	\N	\N
1459	2011-02-05	2011	132	2	3	loss	away	5	\N	\N	\N	\N
1460	2011-02-02	2011	45	0	2	loss	home	5	\N	\N	\N	\N
1461	2011-01-30	2011	42	2	1	win	home	5	\N	\N	\N	\N
1462	2011-01-26	2011	78	2	1	win	away	5	\N	\N	\N	\N
1463	2011-01-23	2011	44	1	2	loss	home	5	\N	\N	\N	\N
1464	2011-01-19	2011	43	0	1	loss	away	5	\N	\N	\N	\N
1465	2011-01-15	2011	1	0	2	loss	home	5	\N	\N	\N	\N
1468	2010-10-24	2010	132	3	0	win	home	14	\N	\N	\N	\N
1469	2010-10-20	2010	132	0	0	draw	away	14	\N	\N	\N	\N
1470	2010-10-17	2010	135	10	1	win	home	14	\N	\N	\N	\N
1471	2010-10-10	2010	135	3	0	win	away	14	\N	\N	\N	\N
1472	2010-09-26	2010	84	3	0	win	away	14	\N	\N	\N	\N
1473	2010-09-18	2010	135	2	0	win	away	14	\N	\N	\N	\N
1474	2010-09-15	2010	136	5	1	win	home	14	\N	\N	\N	\N
1475	2010-09-12	2010	38	2	2	draw	home	8	\N	\N	\N	\N
1476	2010-09-08	2010	132	0	1	loss	away	14	\N	\N	\N	\N
1477	2010-09-05	2010	38	0	5	loss	away	8	\N	\N	\N	\N
1478	2010-08-29	2010	137	2	1	win	home	14	\N	\N	\N	\N
1480	2010-08-22	2010	4	1	2	loss	home	8	\N	\N	\N	\N
1482	2010-08-15	2010	13	2	1	win	away	8	\N	\N	\N	\N
1483	2010-08-08	2010	110	2	0	win	home	8	\N	\N	\N	\N
863	2018-01-18	2018	38	1	1	draw	home	6	1	14	\N	\N
864	2018-01-30	2018	8	0	1	loss	away	6	\N	14	\N	\N
865	2018-02-21	2018	87	1	1	draw	home	6	1	14	\N	\N
866	2018-03-10	2018	87	0	0	draw	away	6	\N	14	\N	\N
867	2018-03-20	2018	8	1	1	draw	home	6	1	14	\N	\N
868	2018-03-29	2018	38	0	0	draw	away	6	\N	14	\N	\N
869	2018-01-21	2018	78	2	2	draw	away	5	\N	14	\N	\N
942	2019-04-28	2019	8	0	4	loss	away	1	\N	\N	\N	\N
943	2019-05-01	2019	19	1	1	draw	home	1	1	\N	\N	\N
944	2019-05-05	2019	21	0	0	draw	home	1	1	\N	\N	\N
945	2019-05-12	2019	32	0	0	draw	away	1	\N	\N	\N	\N
946	2019-05-19	2019	22	0	2	loss	away	1	\N	\N	\N	\N
947	2019-05-27	2019	27	1	0	win	home	1	1	\N	\N	\N
948	2019-06-02	2019	25	0	4	loss	away	1	\N	\N	\N	\N
949	2019-06-09	2019	17	1	2	loss	home	1	1	\N	\N	\N
950	2019-06-12	2019	14	0	2	loss	home	1	1	\N	\N	\N
951	2019-07-14	2019	18	0	1	loss	away	1	\N	\N	\N	\N
952	2019-07-20	2019	24	0	4	loss	home	1	1	\N	\N	\N
953	2019-07-29	2019	23	0	0	draw	home	1	1	\N	\N	\N
954	2019-08-04	2019	16	0	0	draw	away	1	\N	\N	\N	\N
955	2019-08-12	2019	7	0	2	loss	home	1	1	\N	\N	\N
956	2019-08-18	2019	15	1	0	win	away	1	\N	\N	\N	\N
957	2019-08-25	2019	26	1	1	draw	home	1	1	\N	\N	\N
958	2019-08-31	2019	6	0	1	loss	away	1	\N	\N	\N	\N
959	2019-09-08	2019	31	2	0	win	home	1	1	\N	\N	\N
960	2019-09-15	2019	20	1	1	draw	away	1	\N	\N	\N	\N
961	2019-09-22	2019	8	1	0	win	home	1	1	\N	\N	\N
962	2019-09-26	2019	19	2	6	loss	away	1	\N	\N	\N	\N
963	2019-09-29	2019	21	0	2	loss	away	1	\N	\N	\N	\N
964	2019-10-06	2019	32	3	1	win	home	1	1	\N	\N	\N
965	2019-10-09	2019	22	1	0	win	home	1	1	\N	\N	\N
966	2019-10-12	2019	27	0	1	loss	away	1	\N	\N	\N	\N
967	2019-10-16	2019	25	2	2	draw	home	1	1	\N	\N	\N
968	2019-10-21	2019	17	1	2	loss	away	1	\N	\N	\N	\N
969	2019-10-27	2019	14	0	1	loss	away	1	\N	\N	\N	\N
1485	2010-08-01	2010	110	4	3	win	away	8	\N	\N	\N	\N
1487	2010-07-25	2010	13	3	1	win	home	8	\N	\N	\N	\N
1488	2010-07-18	2010	4	1	0	win	away	8	\N	\N	\N	\N
1300	2026-01-11	2026	45	3	0	win	home	5	1	3	\N	\N
1498	2009-08-09	2009	4	2	2	draw	away	8	\N	\N	\N	\N
1499	2009-08-01	2009	97	2	0	win	home	8	\N	\N	\N	\N
1500	2009-07-26	2009	81	1	1	draw	home	8	\N	\N	\N	\N
1501	2009-07-19	2009	81	0	0	draw	away	8	\N	\N	\N	\N
1502	2009-07-12	2009	97	0	0	draw	away	8	\N	\N	\N	\N
1503	2009-07-05	2009	4	0	3	loss	home	8	\N	\N	\N	\N
1504	2009-05-06	2009	35	0	3	loss	away	4	\N	\N	\N	\N
1505	2009-05-03	2009	1	1	2	loss	away	5	\N	\N	\N	\N
1506	2009-04-29	2009	35	0	4	loss	home	4	\N	\N	\N	\N
1507	2009-04-26	2009	44	3	2	win	home	5	\N	\N	\N	\N
1508	2009-04-22	2009	21	1	0	win	away	4	\N	\N	\N	\N
1509	2009-04-18	2009	42	1	4	loss	away	5	\N	\N	\N	\N
1510	2009-04-16	2009	43	2	1	win	home	5	\N	\N	\N	\N
1511	2009-04-13	2009	119	1	2	loss	away	5	\N	\N	\N	\N
1512	2009-04-08	2009	21	0	0	draw	home	4	\N	\N	\N	\N
1513	2009-04-02	2009	1	1	2	loss	home	5	\N	\N	\N	\N
1514	2009-03-29	2009	44	0	3	loss	away	5	\N	\N	\N	\N
1515	2009-03-25	2009	42	2	1	win	home	5	\N	\N	\N	\N
1516	2009-03-22	2009	43	1	1	draw	away	5	\N	\N	\N	\N
1517	2009-03-18	2009	139	3	1	win	home	4	\N	\N	\N	\N
1518	2009-03-14	2009	119	1	2	loss	home	5	\N	\N	\N	\N
1519	2009-03-04	2009	139	3	2	win	away	4	\N	\N	\N	\N
1520	2009-02-15	2009	77	0	1	loss	away	5	\N	\N	\N	\N
1521	2009-02-12	2009	45	3	1	win	home	5	\N	\N	\N	\N
1522	2009-02-10	2009	131	0	1	loss	home	5	\N	\N	\N	\N
1523	2009-02-07	2009	140	3	2	win	home	5	\N	\N	\N	\N
1524	2009-02-04	2009	45	0	1	loss	away	5	\N	\N	\N	\N
1525	2009-01-29	2009	77	2	2	draw	home	5	\N	\N	\N	\N
870	2018-01-24	2018	44	4	0	win	home	5	1	14	\N	\N
871	2018-02-04	2018	42	2	1	win	home	5	1	14	\N	\N
872	2018-02-10	2018	43	0	0	draw	away	5	\N	14	\N	\N
873	2018-02-18	2018	89	5	0	win	home	5	1	14	\N	\N
874	2018-02-25	2018	85	2	0	win	away	5	\N	14	\N	\N
875	2018-03-04	2018	1	0	1	loss	away	5	\N	14	\N	\N
876	2018-03-07	2018	45	1	0	win	home	5	1	14	\N	\N
877	2018-03-14	2018	42	0	1	loss	away	5	\N	14	\N	\N
878	2018-03-24	2018	42	2	1	win	home	5	1	14	\N	\N
879	2018-04-01	2018	1	0	1	loss	home	5	1	14	\N	\N
880	2018-04-08	2018	1	2	0	win	away	5	\N	14	\N	\N
881	2018-02-07	2018	88	2	2	draw	away	4	\N	14	\N	\N
882	2018-02-15	2018	20	0	2	loss	home	4	1	14	\N	\N
883	2018-04-14	2018	27	2	1	win	home	2	1	3	\N	\N
884	2018-04-20	2018	83	1	2	loss	away	2	\N	3	\N	\N
885	2018-04-27	2018	90	5	1	win	home	2	1	3	\N	\N
886	2018-05-01	2018	48	3	1	win	away	2	\N	3	\N	\N
887	2018-05-12	2018	92	1	0	win	home	2	1	3	\N	\N
888	2018-05-19	2018	37	2	1	win	away	2	\N	3	\N	\N
889	2018-05-22	2018	33	1	4	loss	home	2	1	3	\N	\N
890	2018-06-01	2018	74	1	0	win	away	2	\N	3	\N	\N
891	2018-06-05	2018	57	1	2	loss	home	2	1	3	\N	\N
892	2018-06-09	2018	1	0	0	draw	home	2	1	3	\N	\N
893	2018-06-16	2018	39	0	0	draw	away	2	\N	3	\N	\N
894	2018-06-19	2018	50	1	1	draw	away	2	\N	3	\N	\N
895	2018-06-29	2018	35	2	2	draw	home	2	1	3	\N	\N
896	2018-07-05	2018	93	2	0	win	away	2	\N	3	\N	\N
897	2018-07-13	2018	38	1	0	win	home	2	1	3	\N	\N
898	2018-07-20	2018	7	0	0	draw	home	2	1	3	\N	\N
899	2018-07-23	2018	94	2	2	draw	away	2	\N	3	\N	\N
900	2018-07-27	2018	32	0	0	draw	away	2	\N	3	\N	\N
901	2018-08-03	2018	49	1	0	win	home	2	1	3	\N	\N
902	2018-08-10	2018	27	0	3	loss	away	2	\N	3	\N	\N
903	2018-08-18	2018	83	1	0	win	home	2	1	3	\N	\N
904	2018-08-21	2018	90	1	2	loss	away	2	\N	3	\N	\N
905	2018-08-25	2018	48	3	0	win	home	2	1	3	\N	\N
906	2018-09-01	2018	92	0	3	loss	away	2	\N	3	\N	\N
907	2018-09-04	2018	37	4	1	win	home	2	1	3	\N	\N
908	2018-09-08	2018	33	2	1	win	away	2	\N	3	\N	\N
909	2018-09-11	2018	74	1	2	loss	home	2	1	3	\N	\N
910	2018-09-22	2018	57	0	1	loss	away	2	\N	3	\N	\N
911	2018-09-29	2018	1	0	0	draw	away	2	\N	3	\N	\N
912	2018-10-02	2018	39	1	0	win	home	2	1	3	\N	\N
913	2018-10-12	2018	50	1	2	loss	home	2	1	3	\N	\N
914	2018-10-16	2018	35	1	1	draw	away	2	\N	3	\N	\N
915	2018-10-23	2018	93	2	0	win	home	2	1	3	\N	\N
916	2018-11-02	2018	38	3	2	win	away	2	\N	3	\N	\N
917	2018-11-06	2018	7	1	1	draw	away	2	\N	3	\N	\N
918	2018-11-10	2018	94	0	0	draw	home	2	1	3	\N	\N
919	2018-11-17	2018	32	0	1	loss	home	2	1	3	\N	\N
920	2018-11-24	2018	49	4	0	win	away	2	\N	3	\N	\N
980	2020-01-25	2020	2	0	1	loss	home	6	1	3	\N	\N
981	2020-02-01	2020	99	1	3	loss	away	6	\N	3	\N	\N
982	2020-02-09	2020	1	1	1	draw	away	6	\N	3	\N	\N
983	2020-02-16	2020	9	0	1	loss	home	6	1	3	\N	\N
984	2020-02-19	2020	6	0	2	loss	home	6	1	3	\N	\N
985	2020-03-07	2020	7	0	1	loss	away	6	\N	3	\N	\N
986	2020-03-15	2020	101	4	0	win	home	6	1	3	\N	\N
987	2020-07-22	2020	11	2	0	win	away	6	\N	3	\N	\N
988	2020-01-22	2020	85	1	0	win	away	5	\N	3	\N	\N
989	2020-01-28	2020	46	3	2	win	home	5	1	3	\N	\N
990	2020-02-13	2020	43	1	1	draw	home	5	1	3	\N	\N
991	2020-02-22	2020	44	0	1	loss	away	5	\N	3	\N	\N
992	2020-02-29	2020	45	4	0	win	home	5	1	3	\N	\N
993	2020-07-29	2020	42	0	2	loss	away	5	\N	3	\N	\N
994	2020-07-31	2020	1	1	0	win	home	5	1	3	\N	\N
995	2020-08-03	2020	44	4	0	win	home	5	1	3	\N	\N
996	2020-08-05	2020	1	0	1	loss	home	5	1	3	\N	\N
997	2020-02-06	2020	100	1	2	loss	away	4	\N	3	\N	\N
998	2020-08-08	2020	57	1	0	win	home	2	1	14	\N	\N
999	2020-08-18	2020	75	0	3	loss	away	2	\N	14	\N	\N
1000	2020-08-21	2020	50	1	2	loss	away	2	\N	14	\N	\N
1001	2020-08-30	2020	1	0	2	loss	home	2	1	14	\N	\N
1002	2020-09-02	2020	30	1	2	loss	away	2	\N	14	\N	\N
1003	2020-09-05	2020	13	1	1	draw	home	2	1	14	\N	\N
1004	2020-09-13	2020	90	1	2	loss	away	2	\N	14	\N	\N
1005	2020-09-16	2020	29	1	2	loss	home	2	1	14	\N	\N
1006	2020-09-19	2020	26	3	1	win	home	2	1	14	\N	\N
1007	2020-09-26	2020	49	3	2	win	home	2	1	14	\N	\N
1008	2020-09-29	2020	5	1	0	win	away	2	\N	14	\N	\N
1009	2020-10-03	2020	38	0	1	loss	away	2	\N	14	\N	\N
1010	2020-10-06	2020	33	3	0	win	home	2	1	14	\N	\N
1011	2020-10-10	2020	36	4	0	win	home	2	1	14	\N	\N
1012	2020-10-13	2020	32	1	1	draw	away	2	\N	14	\N	\N
1013	2020-10-20	2020	102	1	0	win	home	2	1	14	\N	\N
1014	2020-10-23	2020	103	1	1	draw	away	2	\N	14	\N	\N
1015	2020-10-27	2020	31	0	0	draw	away	2	\N	14	\N	\N
1016	2020-10-31	2020	3	3	1	win	home	2	1	14	\N	\N
1017	2020-11-06	2020	57	1	2	loss	away	2	\N	14	\N	\N
1018	2020-11-10	2020	31	0	1	loss	home	2	1	14	\N	\N
1019	2020-11-21	2020	29	1	0	win	away	2	\N	14	\N	\N
1020	2020-11-24	2020	75	1	0	win	home	2	1	14	\N	\N
1021	2020-11-28	2020	50	2	1	win	home	2	1	14	\N	\N
1022	2020-12-01	2020	1	0	0	draw	away	2	\N	14	\N	\N
1023	2020-12-05	2020	30	0	1	loss	home	2	1	14	\N	\N
1024	2020-12-08	2020	13	5	1	win	away	2	\N	14	\N	\N
1025	2020-12-11	2020	90	2	1	win	home	2	1	14	\N	\N
1026	2020-12-15	2020	26	1	1	draw	away	2	\N	14	\N	\N
1027	2020-12-18	2020	49	0	1	loss	away	2	\N	14	\N	\N
1028	2020-12-22	2020	5	3	0	win	home	2	1	14	\N	\N
1526	2009-01-25	2009	131	0	1	loss	away	5	\N	\N	\N	\N
1527	2009-01-21	2009	140	1	1	draw	away	5	\N	\N	\N	\N
1528	2008-07-27	2008	141	1	0	win	home	3	\N	\N	\N	\N
1529	2008-07-23	2008	97	0	1	loss	away	3	\N	\N	\N	\N
1530	2008-07-20	2008	129	1	3	loss	home	3	\N	\N	\N	\N
1531	2008-07-13	2008	129	0	2	loss	away	3	\N	\N	\N	\N
1532	2008-07-09	2008	97	1	2	loss	home	3	\N	\N	\N	\N
1533	2008-07-06	2008	141	1	2	loss	away	3	\N	\N	\N	\N
1534	2008-05-04	2008	42	2	2	draw	home	5	\N	\N	\N	\N
1535	2008-05-01	2008	42	2	1	win	away	5	\N	\N	\N	\N
1536	2008-04-27	2008	42	2	1	win	away	5	\N	\N	\N	\N
1537	2008-04-23	2008	42	3	0	win	home	5	\N	\N	\N	\N
1538	2008-04-20	2008	45	1	1	draw	home	5	\N	\N	\N	\N
1539	2008-04-16	2008	45	2	1	win	away	5	\N	\N	\N	\N
1540	2008-04-13	2008	1	1	1	draw	home	5	\N	\N	\N	\N
1541	2008-04-06	2008	131	3	4	loss	away	5	\N	\N	\N	\N
1542	2008-03-30	2008	77	3	0	win	away	5	\N	\N	\N	\N
1543	2008-03-25	2008	42	0	1	loss	home	5	\N	\N	\N	\N
1544	2008-03-23	2008	1	1	1	draw	away	5	\N	\N	\N	\N
1545	2008-03-16	2008	77	3	1	win	home	5	\N	\N	\N	\N
1546	2008-03-13	2008	131	2	1	win	home	5	\N	\N	\N	\N
1301	2026-01-14	2026	69	2	0	win	home	5	1	3	\N	\N
1302	2026-01-17	2026	42	0	0	draw	away	5	\N	3	\N	\N
1303	2026-01-21	2026	120	1	0	win	away	5	\N	3	\N	\N
1304	2026-01-24	2026	1	1	1	draw	home	5	1	3	\N	\N
1305	2026-02-01	2026	43	1	0	win	away	5	\N	3	\N	\N
1306	2026-02-07	2026	109	2	0	win	home	5	1	3	\N	\N
1307	2026-02-18	2026	1	0	2	loss	away	5	\N	3	\N	\N
1547	2008-03-11	2008	42	1	0	win	away	5	\N	\N	\N	\N
1548	2008-02-24	2008	131	0	1	loss	away	5	\N	\N	\N	\N
1549	2008-02-20	2008	131	1	2	loss	home	5	\N	\N	\N	\N
1550	2008-02-17	2008	44	0	2	loss	home	5	\N	\N	\N	\N
1551	2008-02-13	2008	45	2	0	win	home	5	\N	\N	\N	\N
1552	2008-02-10	2008	78	4	0	win	home	5	\N	\N	\N	\N
1553	2008-01-30	2008	119	1	2	loss	away	5	\N	\N	\N	\N
1554	2008-01-26	2008	44	0	1	loss	away	5	\N	\N	\N	\N
1555	2008-01-23	2008	45	1	1	draw	away	5	\N	\N	\N	\N
1556	2008-01-20	2008	78	3	2	win	away	5	\N	\N	\N	\N
1557	2008-01-13	2008	119	4	0	win	home	5	\N	\N	\N	\N
1675	2002-10-20	2002	11	1	4	loss	away	3	\N	\N	\N	\N
1102	2022-01-20	2022	106	3	1	win	away	5	\N	3	\N	\N
1103	2022-01-27	2022	46	5	0	win	home	5	1	3	\N	\N
1104	2022-02-05	2022	1	1	0	win	home	5	1	3	\N	\N
1676	2002-10-13	2002	11	0	4	loss	home	3	\N	\N	\N	\N
1677	2002-10-09	2002	41	0	1	loss	away	3	\N	\N	\N	\N
1308	2026-02-21	2026	1	0	2	loss	home	5	1	3	\N	\N
1309	2026-02-04	2026	109	3	0	win	home	12	1	3	\N	\N
1310	2026-02-12	2026	45	1	2	loss	away	12	\N	3	\N	\N
1311	2026-03-05	2026	89	4	0	win	home	12	1	3	\N	\N
1313	2026-03-21	2026	43	5	0	win	home	12	1	3	\N	\N
1314	2026-04-01	2026	42	3	2	win	away	12	\N	3	\N	\N
1315	2026-02-24	2026	34	0	1	loss	away	4	\N	3	\N	\N
1316	2026-04-05	2026	108	3	0	win	home	8	1	3	\N	\N
1317	2026-04-11	2026	121	3	1	win	away	8	\N	3	\N	\N
1318	2026-04-19	2026	42	1	2	loss	away	8	\N	3	\N	\N
1319	2026-04-25	2026	43	1	1	draw	home	8	1	3	\N	\N
1320	2026-05-02	2026	66	2	0	win	home	8	1	3	\N	\N
1321	2026-05-10	2026	66	1	0	win	away	8	\N	3	\N	\N
1322	2026-05-17	2026	43	5	1	win	away	8	\N	3	\N	\N
1323	2026-05-23	2026	42	1	1	draw	home	8	1	3	\N	\N
1324	2026-05-31	2026	121	1	1	draw	home	8	1	3	\N	\N
1325	2026-06-14	2026	108	7	1	win	away	8	\N	3	\N	\N
1326	2026-06-21	2026	122	1	1	draw	away	8	\N	3	\N	\N
1312	2026-03-18	2026	1	3	1	win	away	12	\N	3	\N	\N
1359	2014-01-19	2014	6	4	1	win	home	6	1	\N	\N	\N
1360	2014-01-22	2014	129	2	2	draw	away	6	\N	\N	\N	\N
1361	2014-01-25	2014	4	1	0	win	away	6	\N	\N	\N	\N
1362	2014-01-30	2014	4	1	1	draw	home	6	1	\N	\N	\N
1363	2014-02-02	2014	129	2	1	win	home	6	1	\N	\N	\N
1364	2014-02-05	2014	6	0	1	loss	away	6	\N	\N	\N	\N
1365	2014-02-16	2014	2	0	2	loss	away	6	\N	\N	\N	\N
1366	2014-02-25	2014	2	1	0	win	home	6	1	\N	\N	\N
1367	2014-02-19	2014	1	1	1	draw	home	5	1	\N	\N	\N
1368	2014-02-22	2014	42	2	3	loss	away	5	\N	\N	\N	\N
1369	2014-03-08	2014	43	7	1	win	home	5	1	\N	\N	\N
1370	2014-03-15	2014	130	2	0	win	away	5	\N	\N	\N	\N
1371	2014-03-19	2014	78	2	2	draw	home	5	1	\N	\N	\N
1372	2014-03-22	2014	78	0	0	draw	away	5	\N	\N	\N	\N
1373	2014-03-26	2014	130	3	0	win	home	5	1	\N	\N	\N
1374	2014-03-29	2014	43	0	2	loss	away	5	\N	\N	\N	\N
1375	2014-04-06	2014	42	0	3	loss	home	5	1	\N	\N	\N
1376	2014-04-13	2014	1	0	1	loss	away	5	\N	\N	\N	\N
1377	2014-03-12	2014	20	0	1	loss	home	4	1	\N	\N	\N
1378	2014-04-09	2014	20	0	3	loss	away	4	\N	\N	\N	\N
970	2019-10-30	2019	18	2	1	win	home	1	1	\N	\N	\N
971	2019-11-03	2019	24	0	1	loss	away	1	\N	\N	\N	\N
972	2019-11-07	2019	23	1	2	loss	away	1	\N	\N	\N	\N
973	2019-11-10	2019	16	0	3	loss	home	1	1	\N	\N	\N
974	2019-11-17	2019	7	0	3	loss	away	1	\N	\N	\N	\N
975	2019-11-25	2019	15	0	1	loss	home	1	1	\N	\N	\N
976	2019-11-28	2019	26	1	0	win	away	1	\N	\N	\N	\N
977	2019-12-01	2019	6	1	2	loss	home	1	1	\N	\N	\N
978	2019-12-04	2019	31	0	3	loss	away	1	\N	\N	\N	\N
979	2019-12-08	2019	20	1	2	loss	home	1	1	\N	\N	\N
1067	2021-06-15	2021	57	1	1	draw	home	2	1	\N	\N	\N
1068	2021-06-20	2021	37	1	0	win	home	2	1	\N	\N	\N
776	2016-01-24	2016	69	3	0	win	away	5	\N	\N	\N	\N
777	2016-01-27	2016	77	4	0	win	home	5	1	\N	\N	\N
778	2016-01-31	2016	45	1	0	win	away	5	\N	\N	\N	\N
779	2016-02-03	2016	69	5	1	win	home	5	1	\N	\N	\N
780	2016-02-14	2016	78	2	0	win	away	5	\N	\N	\N	\N
781	2016-02-21	2016	1	1	1	draw	home	5	1	\N	\N	\N
782	2016-02-28	2016	77	2	0	win	away	5	\N	\N	\N	\N
783	2016-03-06	2016	45	2	0	win	home	5	1	\N	\N	\N
784	2016-03-13	2016	1	4	1	win	away	5	\N	\N	\N	\N
785	2016-03-16	2016	78	3	0	win	home	5	1	\N	\N	\N
786	2016-03-20	2016	44	3	0	win	home	5	1	\N	\N	\N
787	2016-03-27	2016	45	2	1	win	away	5	\N	\N	\N	\N
788	2016-04-03	2016	42	1	0	win	home	5	1	\N	\N	\N
789	2016-04-13	2016	78	0	2	loss	away	5	\N	\N	\N	\N
790	2016-04-16	2016	1	2	1	win	home	5	1	\N	\N	\N
791	2016-04-20	2016	44	2	2	draw	away	5	\N	\N	\N	\N
792	2016-04-24	2016	44	2	1	win	home	5	1	\N	\N	\N
793	2016-05-01	2016	1	0	2	loss	away	5	\N	\N	\N	\N
794	2016-05-08	2016	1	0	1	loss	home	5	1	\N	\N	\N
795	2016-06-12	2016	79	1	2	loss	away	8	\N	\N	\N	\N
796	2016-06-19	2016	80	6	0	win	home	8	1	\N	\N	\N
797	2016-06-26	2016	81	2	1	win	home	8	1	\N	\N	\N
798	2016-07-03	2016	81	0	0	draw	away	8	\N	\N	\N	\N
799	2016-07-10	2016	80	3	2	win	away	8	\N	\N	\N	\N
800	2016-07-17	2016	79	1	1	draw	home	8	1	\N	\N	\N
801	2016-07-24	2016	79	2	1	win	away	8	\N	\N	\N	\N
802	2016-07-31	2016	79	3	0	win	home	8	1	\N	\N	\N
803	2016-08-14	2016	82	3	0	win	home	8	1	\N	\N	\N
804	2016-08-21	2016	82	0	2	loss	away	8	\N	\N	\N	\N
805	2016-08-27	2016	61	2	1	win	away	8	\N	\N	\N	\N
806	2016-09-04	2016	61	1	0	win	home	8	1	\N	\N	\N
807	2016-09-11	2016	83	2	0	win	home	8	1	\N	\N	\N
808	2016-09-18	2016	83	0	1	loss	away	8	\N	\N	\N	\N
809	2016-09-29	2016	71	0	0	draw	home	8	1	\N	\N	\N
810	2016-10-01	2016	71	0	4	loss	away	8	\N	\N	\N	\N
1069	2021-06-27	2021	26	2	1	win	home	2	1	\N	\N	\N
1070	2021-06-30	2021	50	1	2	loss	away	2	\N	\N	\N	\N
1071	2021-07-03	2021	1	0	1	loss	home	2	1	\N	\N	\N
1072	2021-07-11	2021	62	3	2	win	away	2	\N	\N	\N	\N
1073	2021-07-14	2021	27	0	1	loss	home	2	1	\N	\N	\N
1074	2021-07-17	2021	75	2	0	win	away	2	\N	\N	\N	\N
1075	2021-07-21	2021	16	2	2	draw	home	2	1	\N	\N	\N
1076	2021-07-24	2021	5	2	1	win	home	2	1	\N	\N	\N
1077	2021-07-27	2021	17	0	2	loss	away	2	\N	\N	\N	\N
1558	2003-10-15	2003	9	2	2	draw	away	3	\N	\N	\N	\N
1327	2025-01-22	2025	45	1	0	win	away	12	\N	3	\N	\N
1328	2025-02-05	2025	1	1	1	draw	home	12	1	3	\N	\N
1329	2025-02-12	2025	89	1	0	win	away	12	\N	3	\N	\N
1330	2025-02-19	2025	69	1	3	loss	home	12	1	3	\N	\N
1331	2025-03-01	2025	44	1	1	draw	away	12	\N	3	\N	\N
1332	2025-03-12	2025	113	0	0	draw	home	12	1	3	\N	\N
1333	2025-03-16	2025	43	1	0	win	home	12	1	3	\N	\N
1334	2025-03-23	2025	43	1	2	loss	away	12	\N	3	\N	\N
1335	2026-07-04	2026	125	0	1	loss	away	8	\N	3	\N	\N
1336	2026-07-13	2026	125	4	0	win	home	8	1	3	\N	\N
1337	2026-07-19	2026	126	0	0	draw	away	8	\N	3	\N	\N
1379	2013-01-12	2013	130	0	0	draw	away	5	\N	\N	\N	\N
1380	2013-01-16	2013	44	1	0	win	home	5	1	\N	\N	\N
1381	2013-01-19	2013	43	1	0	win	away	5	\N	\N	\N	\N
1382	2013-01-23	2013	131	2	4	loss	home	5	1	\N	\N	\N
1383	2013-01-27	2013	132	6	0	win	home	5	1	\N	\N	\N
1384	2013-01-30	2013	133	1	1	draw	away	5	\N	\N	\N	\N
1385	2013-02-02	2013	85	2	1	win	away	5	\N	\N	\N	\N
1386	2013-02-06	2013	85	1	3	loss	home	5	1	\N	\N	\N
1387	2013-02-16	2013	132	0	2	loss	away	5	\N	\N	\N	\N
1388	2013-02-21	2013	131	1	1	draw	away	5	\N	\N	\N	\N
1389	2013-02-23	2013	43	3	1	win	home	5	1	\N	\N	\N
1390	2013-02-25	2013	133	3	0	win	home	5	1	\N	\N	\N
1391	2013-02-27	2013	130	1	2	loss	home	5	1	\N	\N	\N
1392	2013-03-02	2013	44	1	1	draw	away	5	\N	\N	\N	\N
1393	2013-03-10	2013	85	2	0	win	home	5	1	\N	\N	\N
1394	2013-03-17	2013	1	1	1	draw	home	5	1	\N	\N	\N
1395	2013-03-19	2013	44	2	1	win	away	5	\N	\N	\N	\N
1396	2013-03-24	2013	131	2	2	draw	away	5	\N	\N	\N	\N
1397	2013-03-27	2013	131	3	2	win	home	5	1	\N	\N	\N
1398	2013-03-31	2013	44	2	2	draw	home	5	1	\N	\N	\N
1399	2013-04-06	2013	1	0	1	loss	away	5	\N	\N	\N	\N
1400	2013-04-14	2013	42	2	0	win	home	5	1	\N	\N	\N
1401	2013-04-17	2013	42	1	1	draw	away	5	\N	\N	\N	\N
1402	2013-04-20	2013	85	1	1	draw	away	5	\N	\N	\N	\N
1403	2013-04-27	2013	42	1	0	win	away	5	\N	\N	\N	\N
1404	2013-05-05	2013	42	1	1	draw	home	5	1	\N	\N	\N
1405	2013-05-11	2013	1	2	4	loss	home	5	1	\N	\N	\N
1406	2013-05-18	2013	1	1	0	win	away	5	\N	\N	\N	\N
1407	2013-04-10	2013	26	0	3	loss	home	4	1	\N	\N	\N
1408	2013-06-08	2013	129	0	2	loss	away	8	\N	\N	\N	\N
1409	2013-07-07	2013	9	0	1	loss	home	8	1	\N	\N	\N
1410	2013-07-13	2013	97	0	2	loss	home	8	1	\N	\N	\N
1411	2013-07-21	2013	66	0	1	loss	away	8	\N	\N	\N	\N
1412	2013-07-28	2013	97	0	2	loss	away	8	\N	\N	\N	\N
1413	2013-08-04	2013	66	4	1	win	home	8	1	\N	\N	\N
1414	2013-08-11	2013	9	0	2	loss	away	8	\N	\N	\N	\N
1415	2013-08-17	2013	129	2	2	draw	home	8	1	\N	\N	\N
1078	2021-08-01	2021	40	0	1	loss	away	2	\N	\N	\N	\N
1079	2021-08-07	2021	32	0	0	draw	home	2	1	\N	\N	\N
1080	2021-08-10	2021	13	2	0	win	away	2	\N	\N	\N	\N
1081	2021-08-14	2021	35	3	0	win	home	2	1	\N	\N	\N
1082	2021-08-19	2021	103	1	0	win	away	2	\N	\N	\N	\N
1083	2021-08-24	2021	3	0	1	loss	home	2	1	\N	\N	\N
1084	2021-08-28	2021	38	0	2	loss	away	2	\N	\N	\N	\N
1085	2021-09-03	2021	74	1	1	draw	home	2	1	\N	\N	\N
1086	2021-09-07	2021	57	0	1	loss	away	2	\N	\N	\N	\N
1087	2021-09-18	2021	37	2	0	win	away	2	\N	\N	\N	\N
1088	2021-09-23	2021	17	2	0	win	home	2	1	\N	\N	\N
1089	2021-09-26	2021	26	2	1	win	away	2	\N	\N	\N	\N
1090	2021-09-29	2021	50	2	1	win	home	2	1	\N	\N	\N
1091	2021-10-02	2021	1	0	0	draw	away	2	\N	\N	\N	\N
1092	2021-10-09	2021	62	4	1	win	home	2	1	\N	\N	\N
1093	2021-10-15	2021	27	1	3	loss	away	2	\N	\N	\N	\N
1094	2021-10-23	2021	75	2	4	loss	home	2	1	\N	\N	\N
1095	2021-10-29	2021	16	3	1	win	away	2	\N	\N	\N	\N
1096	2021-11-02	2021	5	1	0	win	away	2	\N	\N	\N	\N
1097	2021-11-05	2021	40	2	0	win	home	2	1	\N	\N	\N
1098	2021-11-08	2021	32	1	1	draw	away	2	\N	\N	\N	\N
1099	2021-11-12	2021	13	0	0	draw	home	2	1	\N	\N	\N
1100	2021-11-21	2021	35	1	0	win	away	2	\N	\N	\N	\N
1101	2021-11-28	2021	103	4	0	win	home	2	1	\N	\N	\N
1338	2015-01-28	2015	78	3	2	win	home	5	1	\N	\N	\N
1339	2015-02-04	2015	43	1	0	win	away	5	\N	\N	\N	\N
1340	2015-02-18	2015	42	1	1	draw	home	5	1	\N	\N	\N
1341	2015-02-22	2015	77	0	2	loss	away	5	\N	\N	\N	\N
1128	2022-04-16	2022	61	0	0	draw	away	2	\N	\N	\N	\N
1129	2022-04-22	2022	6	1	1	draw	home	2	1	\N	\N	\N
1130	2022-04-26	2022	62	0	2	loss	away	2	\N	\N	\N	\N
1131	2022-04-30	2022	2	1	0	win	home	2	1	\N	\N	\N
1132	2022-05-04	2022	48	1	1	draw	home	2	1	\N	\N	\N
1133	2022-05-07	2022	16	0	1	loss	away	2	\N	\N	\N	\N
1134	2022-05-14	2022	75	0	0	draw	home	2	1	\N	\N	\N
1135	2022-05-19	2022	3	1	1	draw	away	2	\N	\N	\N	\N
1136	2022-05-28	2022	76	2	1	win	home	2	1	\N	\N	\N
1137	2022-06-01	2022	1	0	0	draw	away	2	\N	\N	\N	\N
1138	2022-06-07	2022	31	1	1	draw	home	2	1	\N	\N	\N
1139	2022-06-12	2022	54	1	2	loss	away	2	\N	\N	\N	\N
1140	2022-06-19	2022	57	0	0	draw	away	2	\N	\N	\N	\N
1141	2022-06-23	2022	23	1	1	draw	home	2	1	\N	\N	\N
1142	2022-06-27	2022	38	0	2	loss	away	2	\N	\N	\N	\N
1143	2022-07-02	2022	37	0	0	draw	away	2	\N	\N	\N	\N
1144	2022-07-07	2022	50	0	1	loss	home	2	1	\N	\N	\N
1145	2022-07-15	2022	74	2	1	win	away	2	\N	\N	\N	\N
1146	2022-07-20	2022	26	1	1	draw	home	2	1	\N	\N	\N
1228	2024-03-06	2024	1	1	0	win	away	12	\N	3	\N	\N
1559	2003-10-12	2003	9	1	2	loss	home	3	\N	\N	\N	\N
1560	2003-10-01	2003	97	3	1	win	home	3	\N	\N	\N	\N
1561	2003-09-27	2003	142	1	3	loss	away	3	\N	\N	\N	\N
1562	2003-09-24	2003	142	3	3	draw	home	3	\N	\N	\N	\N
1563	2003-09-21	2003	97	1	1	draw	away	3	\N	\N	\N	\N
1105	2022-02-26	2022	42	2	2	draw	away	5	\N	3	\N	\N
1106	2022-03-02	2022	109	2	0	win	home	5	1	3	\N	\N
1107	2022-03-09	2022	43	0	0	draw	home	5	1	3	\N	\N
1108	2022-03-12	2022	44	1	0	win	away	5	\N	3	\N	\N
1109	2022-04-02	2022	1	1	0	win	away	5	\N	3	\N	\N
1110	2022-04-06	2022	1	0	1	loss	home	5	1	3	\N	\N
1111	2022-04-09	2022	44	2	0	win	away	5	\N	3	\N	\N
1112	2022-04-12	2022	44	8	0	win	home	5	1	3	\N	\N
1113	2022-04-23	2022	109	2	1	win	away	5	\N	3	\N	\N
1114	2022-05-02	2022	109	3	0	win	home	5	1	3	\N	\N
1115	2022-01-23	2022	107	0	1	loss	away	6	\N	3	\N	\N
1116	2022-01-30	2022	9	3	0	win	home	6	1	3	\N	\N
1117	2022-02-08	2022	56	2	0	win	home	6	1	3	\N	\N
1118	2022-02-13	2022	1	1	1	draw	away	6	\N	3	\N	\N
1119	2022-02-16	2022	6	1	1	draw	away	6	\N	3	\N	\N
1120	2022-02-20	2022	3	3	1	win	home	6	1	3	\N	\N
1121	2022-03-05	2022	8	0	2	loss	away	6	\N	3	\N	\N
1122	2022-03-19	2022	82	3	0	win	home	6	1	3	\N	\N
1123	2022-03-22	2022	2	0	0	draw	home	6	1	3	\N	\N
1124	2022-02-23	2022	108	1	1	draw	away	4	\N	3	\N	\N
1125	2022-03-16	2022	39	4	1	win	home	4	1	3	\N	\N
1126	2022-04-19	2022	30	0	3	loss	home	4	1	3	\N	\N
1127	2022-05-10	2022	30	0	2	loss	away	4	\N	3	\N	\N
1564	2003-03-01	2003	143	0	1	loss	home	5	\N	\N	\N	\N
1565	2003-03-01	2003	42	0	3	loss	away	5	\N	\N	\N	\N
1566	2003-03-01	2003	144	0	2	loss	away	5	\N	\N	\N	\N
1567	2003-03-01	2003	1	2	4	loss	away	5	\N	\N	\N	\N
1568	2003-02-19	2003	43	2	0	win	home	5	\N	\N	\N	\N
1569	2003-02-14	2003	1	1	0	win	home	5	\N	\N	\N	\N
1570	2003-02-12	2003	131	2	3	loss	home	5	\N	\N	\N	\N
1571	2003-02-12	2003	44	1	2	loss	away	5	\N	\N	\N	\N
1572	2003-02-06	2003	144	5	0	win	home	5	\N	\N	\N	\N
1573	2003-01-30	2003	42	0	4	loss	home	5	\N	\N	\N	\N
1574	2003-01-30	2003	143	0	1	loss	away	5	\N	\N	\N	\N
1575	2003-01-24	2003	131	1	1	draw	away	5	\N	\N	\N	\N
1576	2003-01-23	2003	43	0	2	loss	away	5	\N	\N	\N	\N
1577	2003-01-22	2003	44	3	3	draw	home	5	\N	\N	\N	\N
1578	2003-02-20	2003	12	1	2	loss	home	6	\N	\N	\N	\N
1579	2004-07-07	2004	89	1	1	draw	away	14	\N	\N	\N	\N
1582	2004-07-18	2004	89	3	1	win	home	14	\N	\N	\N	\N
1583	2004-07-25	2004	69	0	0	draw	away	14	\N	\N	\N	\N
1584	2004-07-28	2004	69	1	1	draw	home	14	\N	\N	\N	\N
1586	2005-05-22	2005	146	0	3	loss	away	14	\N	\N	\N	\N
1589	2005-06-26	2005	146	1	1	draw	home	14	\N	\N	\N	\N
1591	2005-01-01	2005	148	1	0	win	home	14	\N	\N	\N	\N
1592	2005-01-01	2005	148	1	0	win	home	14	\N	\N	\N	\N
1593	2005-07-10	2005	77	1	1	draw	home	14	\N	\N	\N	\N
1594	2005-07-17	2005	149	2	0	win	away	14	\N	\N	\N	\N
1595	2005-07-21	2005	146	2	0	win	away	14	\N	\N	\N	\N
1596	2005-07-31	2005	146	1	0	win	home	14	\N	\N	\N	\N
1597	2005-08-07	2005	149	1	0	win	home	14	\N	\N	\N	\N
1598	2005-08-14	2005	77	2	4	loss	away	14	\N	\N	\N	\N
1599	2005-08-17	2005	97	2	0	win	away	15	\N	\N	\N	\N
1600	2005-08-24	2005	60	2	4	loss	home	15	\N	\N	\N	\N
1601	2005-09-03	2005	150	2	3	loss	away	15	\N	\N	\N	\N
1216	2024-01-24	2024	109	2	0	win	away	5	\N	3	\N	\N
1217	2024-01-28	2024	1	1	3	loss	home	5	1	3	\N	\N
1218	2024-02-07	2024	42	0	2	loss	away	5	\N	3	\N	\N
1219	2024-02-17	2024	44	0	0	draw	away	5	\N	3	\N	\N
1220	2024-02-24	2024	69	1	1	draw	home	5	1	3	\N	\N
1221	2024-03-02	2024	43	2	3	loss	away	5	\N	3	\N	\N
1222	2024-04-07	2024	43	2	0	win	away	5	\N	3	\N	\N
1223	2024-04-11	2024	43	1	2	loss	home	5	1	3	\N	\N
1224	2024-01-31	2024	45	2	0	win	away	12	\N	3	\N	\N
1225	2024-02-04	2024	43	1	2	loss	home	12	1	3	\N	\N
1226	2024-02-14	2024	69	1	2	loss	away	12	\N	3	\N	\N
1227	2024-02-21	2024	89	6	0	win	home	12	1	3	\N	\N
1229	2024-03-13	2024	109	2	0	win	home	12	1	3	\N	\N
1230	2024-03-23	2024	44	3	3	draw	home	12	1	3	\N	\N
1231	2024-03-26	2024	44	3	0	win	away	12	\N	3	\N	\N
1232	2024-03-31	2024	69	1	1	draw	home	12	1	3	\N	\N
1233	2024-04-03	2024	69	1	0	win	away	12	\N	3	\N	\N
1234	2024-04-20	2024	52	1	3	loss	away	3	\N	3	\N	\N
1235	2024-04-28	2024	118	1	1	draw	home	3	1	3	\N	\N
1236	2024-05-06	2024	37	2	2	draw	away	3	\N	3	\N	\N
1237	2024-05-12	2024	72	0	5	loss	home	3	1	3	\N	\N
1238	2024-05-18	2024	38	0	0	draw	home	3	1	3	\N	\N
1239	2024-05-26	2024	55	0	2	loss	away	3	\N	3	\N	\N
1240	2024-06-03	2024	71	1	2	loss	away	3	\N	3	\N	\N
1602	2005-09-07	2005	13	1	1	draw	home	15	\N	\N	\N	\N
1603	2005-09-14	2005	97	0	0	draw	home	15	\N	\N	\N	\N
1604	2005-09-21	2005	60	1	1	draw	away	15	\N	\N	\N	\N
1605	2005-10-02	2005	13	1	1	draw	away	15	\N	\N	\N	\N
1580	2004-07-11	2004	84	2	0	win	away	14	\N	\N	\N	\N
1168	2023-01-14	2023	43	0	1	loss	away	5	\N	3	\N	\N
1169	2023-01-17	2023	42	0	0	draw	home	5	1	3	\N	\N
1170	2023-01-24	2023	44	4	0	win	home	5	1	3	\N	\N
1171	2023-01-28	2023	1	1	3	loss	away	5	\N	3	\N	\N
1172	2023-02-02	2023	106	1	2	loss	home	5	1	3	\N	\N
1173	2023-02-11	2023	109	1	0	win	home	5	1	3	\N	\N
1174	2023-02-26	2023	45	1	1	draw	away	5	\N	3	\N	\N
1175	2023-01-21	2023	111	0	0	draw	away	6	\N	3	\N	\N
1176	2023-02-05	2023	5	3	1	win	home	6	1	3	\N	\N
1177	2023-02-14	2023	65	1	1	draw	home	6	1	3	\N	\N
1178	2023-02-17	2023	7	0	3	loss	away	6	\N	3	\N	\N
1179	2023-02-22	2023	38	1	1	draw	away	6	\N	3	\N	\N
1180	2023-03-04	2023	1	0	0	draw	home	6	1	3	\N	\N
1181	2023-03-07	2023	108	0	1	loss	away	6	\N	3	\N	\N
1182	2023-03-22	2023	2	1	3	loss	home	6	1	3	\N	\N
1183	2023-01-22	2023	109	0	1	loss	away	12	\N	3	\N	\N
1184	2023-02-04	2023	1	0	0	draw	home	12	1	3	\N	\N
1185	2023-02-16	2023	113	0	1	loss	away	12	\N	3	\N	\N
1186	2023-03-04	2023	44	0	2	loss	away	12	\N	3	\N	\N
1187	2023-03-11	2023	43	2	0	win	home	12	1	3	\N	\N
1188	2023-03-18	2023	112	3	0	win	home	12	1	3	\N	\N
1189	2023-03-23	2023	45	1	1	draw	away	12	\N	3	\N	\N
1190	2023-03-26	2023	42	1	1	draw	away	12	\N	3	\N	\N
1191	2023-03-01	2023	64	1	0	win	away	4	\N	3	\N	\N
1192	2023-03-16	2023	62	1	0	win	home	4	1	3	\N	\N
1193	2023-04-11	2023	22	1	2	loss	away	4	\N	3	\N	\N
1194	2023-04-27	2023	22	2	1	win	home	4	1	3	\N	\N
1195	2023-05-04	2023	13	0	1	loss	home	3	1	3	\N	\N
1196	2023-05-07	2023	52	1	1	draw	away	3	\N	3	\N	\N
1197	2023-05-14	2023	56	2	0	win	away	3	\N	3	\N	\N
1198	2023-05-20	2023	62	0	0	draw	home	3	1	3	\N	\N
1199	2023-05-28	2023	55	1	0	win	home	3	1	3	\N	\N
1200	2023-06-03	2023	82	1	1	draw	away	3	\N	3	\N	\N
1201	2023-06-08	2023	88	2	1	win	home	3	1	3	\N	\N
1202	2023-06-11	2023	75	0	1	loss	away	3	\N	3	\N	\N
1203	2023-06-20	2023	70	1	1	draw	home	3	1	3	\N	\N
1204	2023-06-28	2023	12	0	1	loss	home	3	1	3	\N	\N
1205	2023-07-02	2023	71	1	1	draw	away	3	\N	3	\N	\N
1206	2023-07-09	2023	33	1	1	draw	away	3	\N	3	\N	\N
1207	2023-07-16	2023	73	2	0	win	home	3	1	3	\N	\N
1208	2023-07-23	2023	39	0	1	loss	away	3	\N	3	\N	\N
1209	2023-07-30	2023	115	2	1	win	home	3	1	3	\N	\N
1210	2023-08-06	2023	3	0	0	draw	away	3	\N	3	\N	\N
1211	2023-08-13	2023	9	1	1	draw	home	3	1	3	\N	\N
1212	2023-08-20	2023	40	0	0	draw	home	3	1	3	\N	\N
1213	2023-08-26	2023	116	0	1	loss	away	3	\N	3	\N	\N
1241	2024-06-10	2024	73	1	1	draw	home	3	1	3	\N	\N
1242	2024-06-15	2024	9	1	1	draw	home	3	1	3	\N	\N
1243	2024-06-27	2024	13	1	0	win	away	3	\N	3	\N	\N
1244	2024-07-03	2024	33	3	1	win	home	3	1	3	\N	\N
1245	2024-07-06	2024	11	2	0	win	away	3	\N	3	\N	\N
1246	2024-07-14	2024	56	1	2	loss	home	3	1	3	\N	\N
1247	2024-07-22	2024	40	1	2	loss	away	3	\N	3	\N	\N
1248	2024-07-27	2024	65	1	1	draw	away	3	\N	3	\N	\N
1249	2024-08-04	2024	3	2	2	draw	home	3	1	3	\N	\N
1250	2024-08-11	2024	54	1	0	win	away	3	\N	3	\N	\N
1251	2024-08-18	2024	70	1	0	win	away	3	\N	3	\N	\N
1252	2024-08-24	2024	58	2	1	win	home	3	1	3	\N	\N
1255	2025-01-12	2025	43	3	0	win	home	5	1	3	\N	\N
1256	2025-01-15	2025	119	3	0	win	away	5	\N	3	\N	\N
1257	2025-01-18	2025	44	2	0	win	home	5	1	3	\N	\N
1258	2025-01-25	2025	1	3	2	win	away	5	\N	3	\N	\N
1259	2025-01-29	2025	45	1	1	draw	away	5	\N	3	\N	\N
1260	2025-02-01	2025	42	0	0	draw	home	5	1	3	\N	\N
1261	2025-02-08	2025	69	0	2	loss	away	5	\N	3	\N	\N
1262	2025-02-16	2025	42	0	1	loss	away	5	\N	3	\N	\N
1263	2025-02-22	2025	42	1	0	win	home	5	1	3	\N	\N
1264	2025-04-02	2025	43	0	0	draw	home	5	1	3	\N	\N
1265	2025-04-06	2025	43	1	0	win	away	5	\N	3	\N	\N
1266	2025-01-21	2025	13	2	1	win	home	6	1	3	\N	\N
1267	2025-02-05	2025	8	0	1	loss	away	6	\N	3	\N	\N
1268	2025-02-13	2025	38	4	0	win	home	6	1	3	\N	\N
1269	2025-02-26	2025	3	4	1	win	home	6	1	3	\N	\N
1270	2025-03-06	2025	66	2	2	draw	away	6	\N	3	\N	\N
1271	2025-03-19	2025	6	1	2	loss	home	6	1	3	\N	\N
1272	2025-06-07	2025	12	1	0	win	away	6	\N	3	\N	\N
1273	2025-07-09	2025	65	2	1	win	home	6	1	3	\N	\N
1274	2025-08-20	2025	13	0	1	loss	home	6	1	3	\N	\N
1275	2025-02-19	2025	63	2	0	win	away	4	\N	3	\N	\N
1276	2025-03-13	2025	64	5	0	win	home	4	1	3	\N	\N
1277	2025-04-30	2025	23	3	2	win	home	4	1	3	\N	\N
1278	2025-05-20	2025	23	0	0	draw	away	4	\N	3	\N	\N
1279	2025-07-30	2025	16	0	0	draw	home	4	1	3	\N	\N
1280	2025-08-07	2025	16	1	3	loss	away	4	\N	3	\N	\N
1281	2025-04-12	2025	51	1	1	draw	home	3	1	3	\N	\N
1282	2025-04-21	2025	11	1	1	draw	away	3	\N	3	\N	\N
1283	2025-04-26	2025	3	2	1	win	home	3	1	3	\N	\N
1284	2025-05-04	2025	52	0	1	loss	away	3	\N	3	\N	\N
1215	2024-01-21	2024	45	1	0	win	home	5	1	3	\N	\N
1029	2021-01-02	2021	38	2	1	win	home	2	1	14	\N	\N
1030	2021-01-08	2021	33	0	0	draw	away	2	\N	14	\N	\N
1031	2021-01-12	2021	36	0	2	loss	away	2	\N	14	\N	\N
1032	2021-01-16	2021	32	1	1	draw	home	2	1	14	\N	\N
1033	2021-01-19	2021	102	3	1	win	away	2	\N	14	\N	\N
1034	2021-01-22	2021	103	1	1	draw	home	2	1	14	\N	\N
1035	2021-01-29	2021	3	1	1	draw	away	2	\N	14	\N	\N
1038	2021-01-30	2021	85	0	2	loss	away	12	\N	3	\N	\N
1039	2021-02-04	2021	46	0	0	draw	home	12	1	3	\N	\N
1040	2021-02-07	2021	45	0	3	loss	home	12	1	3	\N	\N
1041	2021-02-20	2021	44	0	0	draw	home	5	1	3	\N	\N
1042	2021-02-25	2021	46	4	1	win	away	5	\N	3	\N	\N
1043	2021-03-03	2021	85	5	0	win	home	5	1	3	\N	\N
1606	2005-10-04	2005	150	1	1	draw	home	15	\N	\N	\N	\N
1607	2006-08-06	2006	151	0	1	loss	away	3	\N	\N	\N	\N
1608	2006-08-02	2006	6	3	3	draw	home	3	\N	\N	\N	\N
1609	2006-07-30	2006	13	1	3	loss	home	3	\N	\N	\N	\N
1610	2006-07-23	2006	13	1	1	draw	away	3	\N	\N	\N	\N
1611	2006-07-19	2006	6	0	1	loss	away	3	\N	\N	\N	\N
1612	2006-07-16	2006	151	3	1	win	home	3	\N	\N	\N	\N
1613	2006-06-21	2006	45	1	0	win	away	5	\N	\N	\N	\N
1614	2006-06-17	2006	45	0	1	loss	home	5	\N	\N	\N	\N
1615	2006-06-14	2006	131	2	0	win	home	5	\N	\N	\N	\N
1616	2006-06-11	2006	131	0	0	draw	away	5	\N	\N	\N	\N
1617	2006-05-31	2006	131	3	1	win	home	5	\N	\N	\N	\N
1618	2006-05-28	2006	131	1	5	loss	away	5	\N	\N	\N	\N
1619	2006-05-24	2006	43	5	0	win	home	5	\N	\N	\N	\N
1620	2006-05-21	2006	69	1	0	win	away	5	\N	\N	\N	\N
1621	2006-05-17	2006	44	1	0	win	home	5	\N	\N	\N	\N
1622	2006-05-14	2006	131	1	0	win	away	5	\N	\N	\N	\N
1623	2006-05-10	2006	45	4	0	win	home	5	\N	\N	\N	\N
1624	2006-05-07	2006	77	1	1	draw	home	5	\N	\N	\N	\N
1625	2006-05-03	2006	42	0	2	loss	away	5	\N	\N	\N	\N
1626	2006-04-30	2006	43	0	1	loss	away	5	\N	\N	\N	\N
1627	2006-04-26	2006	69	2	1	win	home	5	\N	\N	\N	\N
1628	2006-04-23	2006	44	2	1	win	away	5	\N	\N	\N	\N
1629	2006-04-19	2006	131	2	3	loss	home	5	\N	\N	\N	\N
1630	2006-04-16	2006	45	1	1	draw	away	5	\N	\N	\N	\N
1631	2006-04-12	2006	77	1	1	draw	away	5	\N	\N	\N	\N
839	2017-05-14	2017	42	3	0	win	home	3	1	3	\N	\N
840	2017-05-20	2017	38	2	0	win	away	3	\N	3	\N	\N
841	2017-05-28	2017	9	0	2	loss	away	3	\N	3	\N	\N
842	2017-06-04	2017	86	2	1	win	home	3	1	3	\N	\N
843	2017-06-10	2017	40	1	1	draw	away	3	\N	3	\N	\N
844	2017-06-16	2017	13	1	1	draw	home	3	1	3	\N	\N
845	2017-06-26	2017	7	1	0	win	home	3	1	3	\N	\N
846	2017-07-02	2017	87	1	0	win	away	3	\N	3	\N	\N
847	2017-07-09	2017	29	0	0	draw	home	3	1	3	\N	\N
848	2017-07-15	2017	42	0	0	draw	away	3	\N	3	\N	\N
849	2017-07-23	2017	38	1	1	draw	home	3	1	3	\N	\N
850	2017-07-30	2017	9	2	1	win	home	3	1	3	\N	\N
851	2017-08-05	2017	86	1	1	draw	away	3	\N	3	\N	\N
852	2017-08-12	2017	40	2	0	win	home	3	1	3	\N	\N
853	2017-08-19	2017	13	0	2	loss	away	3	\N	3	\N	\N
854	2017-08-27	2017	7	1	1	draw	away	3	\N	3	\N	\N
855	2017-09-04	2017	87	2	0	win	home	3	1	3	\N	\N
856	2017-09-09	2017	29	1	1	draw	away	3	\N	3	\N	\N
857	2017-09-18	2017	54	2	0	win	away	3	\N	3	\N	\N
858	2017-09-25	2017	54	1	0	win	home	3	1	3	\N	\N
859	2017-10-01	2017	83	1	0	win	away	3	\N	3	\N	\N
860	2017-10-07	2017	83	0	1	loss	home	3	1	3	\N	\N
861	2017-10-14	2017	7	2	1	win	away	3	\N	3	\N	\N
862	2017-10-21	2017	7	0	0	draw	home	3	1	3	\N	\N
1044	2021-03-27	2021	42	2	2	draw	away	5	\N	3	\N	\N
1045	2021-04-06	2021	45	5	0	win	home	5	1	3	\N	\N
1046	2021-04-20	2021	106	0	0	draw	away	5	\N	3	\N	\N
1047	2021-05-01	2021	1	1	0	win	home	5	1	3	\N	\N
1048	2021-05-05	2021	43	0	2	loss	away	5	\N	3	\N	\N
1049	2021-05-08	2021	43	1	1	draw	away	5	\N	3	\N	\N
1050	2021-05-11	2021	43	3	0	win	home	5	1	3	\N	\N
1051	2021-05-15	2021	1	0	0	draw	home	5	1	3	\N	\N
1052	2021-05-22	2021	1	1	1	draw	away	5	\N	3	\N	\N
1053	2021-02-28	2021	41	1	1	draw	home	6	1	3	\N	\N
1054	2021-03-07	2021	13	2	2	draw	away	6	\N	3	\N	\N
1055	2021-03-14	2021	1	1	1	draw	home	6	1	3	\N	\N
1056	2021-03-20	2021	4	2	1	win	away	6	\N	3	\N	\N
1057	2021-03-23	2021	6	2	0	win	home	6	1	3	\N	\N
1058	2021-03-31	2021	8	0	2	loss	away	6	\N	3	\N	\N
1059	2021-04-03	2021	104	2	2	draw	home	6	1	3	\N	\N
1060	2021-04-10	2021	38	0	0	draw	away	6	\N	3	\N	\N
1061	2021-04-17	2021	7	1	2	loss	away	6	\N	3	\N	\N
1062	2021-03-17	2021	105	5	1	win	away	4	\N	3	\N	\N
1063	2021-04-13	2021	40	1	1	draw	home	4	1	3	\N	\N
1632	2006-04-09	2006	42	2	0	win	home	5	\N	\N	\N	\N
1633	2006-04-05	2006	45	0	3	loss	away	5	\N	\N	\N	\N
1634	2006-04-02	2006	45	0	0	draw	home	5	\N	\N	\N	\N
1635	2006-03-29	2006	1	2	2	draw	home	5	\N	\N	\N	\N
1636	2006-03-26	2006	1	1	1	draw	away	5	\N	\N	\N	\N
1285	2025-05-11	2025	53	3	2	win	home	3	1	3	\N	\N
1286	2025-05-17	2025	54	0	0	draw	away	3	\N	3	\N	\N
1287	2025-05-24	2025	13	0	0	draw	home	3	1	3	\N	\N
1288	2025-06-02	2025	55	3	1	win	away	3	\N	3	\N	\N
1289	2025-06-16	2025	56	2	0	win	home	3	1	3	\N	\N
1290	2025-06-28	2025	57	0	1	loss	away	3	\N	3	\N	\N
1291	2025-07-05	2025	58	2	3	loss	home	3	1	3	\N	\N
1292	2025-07-14	2025	59	0	0	draw	away	3	\N	3	\N	\N
1293	2025-07-20	2025	33	1	1	draw	home	3	1	3	\N	\N
1294	2025-07-26	2025	37	1	3	loss	away	3	\N	3	\N	\N
1295	2025-08-02	2025	9	2	1	win	home	3	1	3	\N	\N
1296	2025-08-11	2025	60	0	1	loss	away	3	\N	3	\N	\N
1297	2025-08-16	2025	61	2	2	draw	home	3	1	3	\N	\N
1298	2025-08-25	2025	50	1	2	loss	home	3	1	3	\N	\N
1299	2025-08-30	2025	62	0	2	loss	away	3	\N	3	\N	\N
1637	2006-03-19	2006	44	2	1	win	away	5	\N	\N	\N	\N
1638	2006-03-16	2006	77	5	0	win	home	5	\N	\N	\N	\N
1639	2006-03-14	2006	1	0	2	loss	away	5	\N	\N	\N	\N
1640	2006-03-11	2006	144	2	0	win	home	5	\N	\N	\N	\N
1641	2006-03-05	2006	69	2	0	win	home	5	\N	\N	\N	\N
1642	2006-03-02	2006	43	3	2	win	away	5	\N	\N	\N	\N
1643	2006-02-19	2006	45	2	1	win	home	5	\N	\N	\N	\N
1644	2006-02-16	2006	42	1	1	draw	away	5	\N	\N	\N	\N
1645	2006-02-14	2006	131	0	1	loss	home	5	\N	\N	\N	\N
1646	2006-02-11	2006	44	2	2	draw	home	5	\N	\N	\N	\N
1647	2006-02-08	2006	77	2	2	draw	away	5	\N	\N	\N	\N
1648	2006-02-05	2006	1	0	0	draw	home	5	\N	\N	\N	\N
1649	2006-02-01	2006	144	1	0	win	away	5	\N	\N	\N	\N
1650	2006-01-29	2006	69	2	1	win	away	5	\N	\N	\N	\N
1651	2006-01-25	2006	43	1	0	win	home	5	\N	\N	\N	\N
1416	2012-01-14	2012	1	0	3	loss	away	5	\N	\N	\N	\N
1417	2012-01-18	2012	43	2	1	win	home	5	1	\N	\N	\N
1418	2012-01-21	2012	44	1	2	loss	away	5	\N	\N	\N	\N
1419	2012-01-25	2012	45	2	0	win	home	5	1	\N	\N	\N
1420	2012-01-28	2012	132	0	1	loss	away	5	\N	\N	\N	\N
1421	2012-02-01	2012	42	0	0	draw	away	5	\N	\N	\N	\N
1422	2012-02-05	2012	131	4	0	win	home	5	1	\N	\N	\N
1423	2012-02-08	2012	69	2	0	win	away	5	\N	\N	\N	\N
1424	2012-02-12	2012	85	0	0	draw	home	5	1	\N	\N	\N
1425	2012-03-07	2012	85	1	2	loss	away	5	\N	\N	\N	\N
1426	2012-03-11	2012	69	4	0	win	home	5	1	\N	\N	\N
1427	2012-03-17	2012	131	2	1	win	away	5	\N	\N	\N	\N
1428	2012-03-25	2012	42	3	2	win	home	5	1	\N	\N	\N
1429	2012-03-28	2012	132	2	0	win	home	5	1	\N	\N	\N
1430	2012-03-31	2012	45	1	0	win	away	5	\N	\N	\N	\N
1431	2012-04-08	2012	44	2	1	win	home	5	1	\N	\N	\N
1432	2012-04-14	2012	43	5	0	win	away	5	\N	\N	\N	\N
1433	2012-04-21	2012	1	2	2	draw	home	5	1	\N	\N	\N
1434	2012-04-25	2012	132	0	0	draw	away	5	\N	\N	\N	\N
1435	2012-04-29	2012	132	3	2	win	home	5	1	\N	\N	\N
1436	2012-05-01	2012	42	0	2	loss	away	5	\N	\N	\N	\N
1437	2012-05-05	2012	42	0	0	draw	home	5	1	\N	\N	\N
1438	2012-06-24	2012	129	3	1	win	home	8	1	\N	\N	\N
1439	2012-07-08	2012	134	3	1	win	away	8	\N	\N	\N	\N
1440	2012-07-15	2012	107	0	0	draw	away	8	\N	\N	\N	\N
1441	2012-07-22	2012	60	1	0	win	home	8	1	\N	\N	\N
1442	2012-07-29	2012	107	2	1	win	home	8	1	\N	\N	\N
1443	2012-08-05	2012	60	0	0	draw	away	8	\N	\N	\N	\N
1444	2012-08-12	2012	134	5	0	win	home	8	1	\N	\N	\N
1445	2012-08-26	2012	129	1	0	win	away	8	\N	\N	\N	\N
1446	2012-09-01	2012	10	1	2	loss	away	8	\N	\N	\N	\N
1447	2012-09-09	2012	10	0	0	draw	home	8	1	\N	\N	\N
1147	2022-07-25	2022	48	1	2	loss	away	2	\N	\N	\N	\N
1148	2022-07-30	2022	61	1	3	loss	home	2	1	\N	\N	\N
1149	2022-08-06	2022	6	0	1	loss	away	2	\N	\N	\N	\N
1150	2022-08-09	2022	62	1	0	win	home	2	1	\N	\N	\N
1151	2022-08-13	2022	2	0	4	loss	away	2	\N	\N	\N	\N
1152	2022-08-18	2022	16	2	0	win	home	2	1	\N	\N	\N
1153	2022-08-27	2022	75	0	0	draw	away	2	\N	\N	\N	\N
1154	2022-08-30	2022	3	2	0	win	home	2	1	\N	\N	\N
1155	2022-09-03	2022	76	1	1	draw	away	2	\N	\N	\N	\N
1156	2022-09-10	2022	1	1	1	draw	home	2	1	\N	\N	\N
1157	2022-09-17	2022	31	0	1	loss	away	2	\N	\N	\N	\N
1158	2022-09-26	2022	54	2	0	win	home	2	1	\N	\N	\N
1159	2022-09-30	2022	57	1	2	loss	home	2	1	\N	\N	\N
1160	2022-10-04	2022	23	0	2	loss	away	2	\N	\N	\N	\N
1161	2022-10-07	2022	38	0	0	draw	home	2	1	\N	\N	\N
1162	2022-10-14	2022	37	0	1	loss	home	2	1	\N	\N	\N
1163	2022-10-20	2022	50	2	0	win	away	2	\N	\N	\N	\N
1164	2022-10-25	2022	74	1	0	win	home	2	1	\N	\N	\N
1165	2022-11-06	2022	26	2	3	loss	away	2	\N	\N	\N	\N
1343	2015-03-08	2015	85	2	0	win	home	5	1	\N	\N	\N
811	2017-01-21	2017	44	2	0	win	home	5	1	\N	\N	\N
812	2017-01-29	2017	84	3	1	win	away	5	\N	\N	\N	\N
813	2017-02-01	2017	45	1	0	win	away	5	\N	\N	\N	\N
814	2017-02-13	2017	85	1	0	win	home	5	1	\N	\N	\N
815	2017-02-16	2017	44	1	1	draw	away	5	\N	\N	\N	\N
816	2017-02-19	2017	1	1	1	draw	home	5	1	\N	\N	\N
817	2017-02-25	2017	84	7	0	win	home	5	1	\N	\N	\N
818	2017-03-05	2017	85	1	0	win	away	5	\N	\N	\N	\N
819	2017-03-19	2017	45	3	0	win	home	5	1	\N	\N	\N
820	2017-03-26	2017	1	0	0	draw	away	5	\N	\N	\N	\N
821	2017-03-29	2017	85	2	0	win	home	5	1	\N	\N	\N
822	2017-04-02	2017	42	0	1	loss	away	5	\N	\N	\N	\N
823	2017-04-09	2017	1	0	0	draw	home	5	1	\N	\N	\N
1652	2006-01-22	2006	45	0	1	loss	away	5	\N	\N	\N	\N
824	2017-04-12	2017	44	0	0	draw	away	5	\N	\N	\N	\N
825	2017-04-16	2017	78	2	1	win	home	5	1	\N	\N	\N
826	2017-04-19	2017	42	1	1	draw	home	5	1	\N	\N	\N
827	2017-04-23	2017	42	2	1	win	away	5	\N	\N	\N	\N
828	2017-04-30	2017	1	0	1	loss	away	5	\N	\N	\N	\N
829	2017-05-07	2017	1	2	3	loss	home	5	1	\N	\N	\N
830	2017-01-25	2017	11	3	0	win	home	6	1	\N	\N	\N
831	2017-02-05	2017	1	1	2	loss	away	6	\N	\N	\N	\N
832	2017-02-11	2017	60	1	2	loss	home	6	1	\N	\N	\N
833	2017-03-02	2017	60	1	2	loss	away	6	\N	\N	\N	\N
834	2017-03-11	2017	1	1	0	win	home	6	1	\N	\N	\N
835	2017-03-22	2017	11	1	2	loss	away	6	\N	\N	\N	\N
836	2017-02-08	2017	2	1	4	loss	home	4	1	\N	\N	\N
1064	2021-05-28	2021	3	0	1	loss	away	2	\N	\N	\N	\N
1065	2021-06-05	2021	38	0	0	draw	home	2	1	\N	\N	\N
1066	2021-06-12	2021	74	0	1	loss	away	2	\N	\N	\N	\N
1344	2015-03-11	2015	42	0	0	draw	home	5	1	\N	\N	\N
1345	2015-03-15	2015	42	1	1	draw	away	5	\N	\N	\N	\N
1346	2015-03-19	2015	42	0	0	draw	away	5	\N	\N	\N	\N
1347	2015-03-22	2015	43	1	1	draw	home	5	1	\N	\N	\N
1348	2015-03-25	2015	78	1	2	loss	away	5	\N	\N	\N	\N
1349	2015-03-29	2015	44	1	0	win	home	5	1	\N	\N	\N
1350	2015-04-05	2015	1	1	2	loss	away	5	\N	\N	\N	\N
1351	2015-04-08	2015	1	0	1	loss	home	5	1	\N	\N	\N
1352	2015-04-12	2015	44	3	1	win	away	5	\N	\N	\N	\N
1353	2015-04-15	2015	78	1	0	win	home	5	1	\N	\N	\N
1355	2015-04-19	2015	43	1	1	draw	away	5	\N	\N	\N	\N
1356	2015-04-22	2015	42	0	1	loss	home	5	1	\N	\N	\N
1357	2015-04-25	2015	45	0	1	loss	away	5	\N	\N	\N	\N
1358	2015-04-27	2015	45	1	2	loss	home	5	1	\N	\N	\N
1653	2006-01-18	2006	42	3	1	win	home	5	\N	\N	\N	\N
1654	2006-01-15	2006	131	1	1	draw	away	5	\N	\N	\N	\N
1655	2007-03-28	2007	43	1	1	draw	home	5	\N	\N	\N	\N
1656	2007-03-25	2007	119	0	1	loss	away	5	\N	\N	\N	\N
1657	2007-03-22	2007	44	2	2	draw	home	5	\N	\N	\N	\N
1658	2007-03-18	2007	42	0	1	loss	away	5	\N	\N	\N	\N
1659	2007-03-14	2007	45	0	0	draw	home	5	\N	\N	\N	\N
1660	2007-03-12	2007	77	2	4	loss	away	5	\N	\N	\N	\N
1661	2007-03-08	2007	131	0	0	draw	home	5	\N	\N	\N	\N
1662	2007-03-05	2007	69	2	2	draw	home	5	\N	\N	\N	\N
1663	2007-03-01	2007	17	2	5	loss	away	4	\N	\N	\N	\N
1664	2007-02-25	2007	1	2	0	win	away	5	\N	\N	\N	\N
1665	2007-02-14	2007	17	1	1	draw	home	4	\N	\N	\N	\N
1666	2007-02-11	2007	43	0	0	draw	away	5	\N	\N	\N	\N
1667	2007-02-07	2007	119	1	0	win	home	5	\N	\N	\N	\N
1668	2007-02-03	2007	44	0	1	loss	away	5	\N	\N	\N	\N
1669	2007-01-31	2007	42	2	2	draw	home	5	\N	\N	\N	\N
1670	2007-01-28	2007	45	0	2	loss	away	5	\N	\N	\N	\N
1671	2007-01-24	2007	77	2	2	draw	home	5	\N	\N	\N	\N
1672	2007-01-21	2007	131	1	0	win	away	5	\N	\N	\N	\N
1673	2007-01-17	2007	69	0	0	draw	away	5	\N	\N	\N	\N
1674	2007-01-14	2007	1	1	2	loss	home	5	\N	\N	\N	\N
1678	2002-10-04	2002	41	6	1	win	home	3	\N	\N	\N	\N
1679	2002-09-28	2002	13	2	2	draw	home	3	\N	\N	\N	\N
1680	2002-09-21	2002	131	1	3	loss	away	3	\N	\N	\N	\N
1681	2002-09-15	2002	97	1	1	draw	home	3	\N	\N	\N	\N
1682	2002-09-08	2002	97	1	0	win	away	3	\N	\N	\N	\N
1683	2002-09-02	2002	131	2	1	win	home	3	\N	\N	\N	\N
1684	2002-08-25	2002	13	1	0	win	away	3	\N	\N	\N	\N
1685	2002-06-29	2002	1	0	2	loss	away	5	\N	\N	\N	\N
1686	2002-06-27	2002	44	1	1	draw	away	5	\N	\N	\N	\N
1687	2002-06-23	2002	131	1	0	win	away	5	\N	\N	\N	\N
1688	2002-06-19	2002	1	1	2	loss	home	5	\N	\N	\N	\N
1689	2002-06-16	2002	44	2	0	win	home	5	\N	\N	\N	\N
1690	2002-06-12	2002	131	2	0	win	home	5	\N	\N	\N	\N
1691	2002-06-09	2002	1	2	0	win	away	5	\N	\N	\N	\N
1692	2002-06-02	2002	144	1	3	loss	away	5	\N	\N	\N	\N
1693	2002-05-30	2002	143	1	1	draw	home	5	\N	\N	\N	\N
1694	2002-05-26	2002	42	1	0	win	away	5	\N	\N	\N	\N
1695	2002-05-22	2002	69	1	0	win	home	5	\N	\N	\N	\N
1696	2002-05-19	2002	44	2	3	loss	away	5	\N	\N	\N	\N
1697	2002-05-16	2002	131	2	2	draw	home	5	\N	\N	\N	\N
1698	2002-05-11	2002	1	0	3	loss	home	5	\N	\N	\N	\N
1699	2002-05-08	2002	144	6	0	win	home	5	\N	\N	\N	\N
1700	2002-05-05	2002	143	2	1	win	away	5	\N	\N	\N	\N
1701	2002-05-01	2002	42	0	0	draw	home	5	\N	\N	\N	\N
1702	2002-04-28	2002	69	3	0	win	away	5	\N	\N	\N	\N
1703	2002-04-24	2002	44	4	1	win	home	5	\N	\N	\N	\N
1704	2002-04-21	2002	131	1	1	draw	away	5	\N	\N	\N	\N
1705	2002-04-14	2002	5	0	1	loss	home	6	\N	\N	\N	\N
1706	2002-04-07	2002	41	1	1	draw	away	6	\N	\N	\N	\N
1707	2002-03-30	2002	12	1	1	draw	away	6	\N	\N	\N	\N
1708	2002-03-24	2002	8	0	1	loss	home	6	\N	\N	\N	\N
1709	2002-03-20	2002	6	1	4	loss	away	6	\N	\N	\N	\N
1710	2002-03-17	2002	9	3	0	win	home	6	\N	\N	\N	\N
1711	2002-03-10	2002	138	1	1	draw	home	6	\N	\N	\N	\N
1712	2002-03-02	2002	97	3	2	win	home	6	\N	\N	\N	\N
1713	2002-02-24	2002	11	3	1	win	away	6	\N	\N	\N	\N
1714	2002-02-17	2002	1	1	1	draw	away	6	\N	\N	\N	\N
1715	2002-02-09	2002	13	4	2	win	home	6	\N	\N	\N	\N
1716	2002-02-03	2002	4	2	0	win	away	6	\N	\N	\N	\N
1717	2002-01-30	2002	3	3	3	draw	away	6	\N	\N	\N	\N
1719	2002-01-20	2002	7	1	1	draw	away	6	\N	\N	\N	\N
1720	2002-03-27	2002	16	2	1	win	home	4	\N	\N	\N	\N
1721	2002-04-03	2002	16	0	4	loss	away	4	\N	\N	\N	\N
1722	2002-03-14	2002	8	3	2	win	away	4	\N	\N	\N	\N
1723	2002-03-06	2002	8	0	0	draw	home	4	\N	\N	\N	\N
1724	2002-02-20	2002	86	2	0	win	home	4	\N	\N	\N	\N
1725	2002-02-14	2002	86	2	1	win	away	4	\N	\N	\N	\N
1726	2001-01-17	2001	7	0	1	loss	home	6	\N	\N	\N	\N
1728	2001-02-01	2001	13	1	1	draw	home	6	\N	\N	\N	\N
1729	2001-02-07	2001	4	1	0	win	home	6	\N	\N	\N	\N
1730	2001-02-11	2001	1	2	0	win	home	6	\N	\N	\N	\N
1731	2001-02-15	2001	11	0	2	loss	home	6	\N	\N	\N	\N
1732	2001-02-22	2001	97	2	0	win	away	6	\N	\N	\N	\N
1733	2001-02-28	2001	3	0	3	loss	away	6	\N	\N	\N	\N
1735	2001-03-11	2001	9	2	1	win	away	6	\N	\N	\N	\N
1736	2001-03-17	2001	6	0	3	loss	home	6	\N	\N	\N	\N
1737	2001-03-26	2001	8	2	3	loss	away	6	\N	\N	\N	\N
1738	2001-04-01	2001	12	1	2	loss	away	6	\N	\N	\N	\N
1739	2001-04-08	2001	41	1	1	draw	home	6	\N	\N	\N	\N
1740	2001-04-14	2001	5	2	3	loss	away	6	\N	\N	\N	\N
1744	2001-04-18	2001	42	2	2	draw	away	5	\N	\N	\N	\N
1745	2001-04-22	2001	143	1	0	win	home	5	\N	\N	\N	\N
1746	2001-04-25	2001	44	0	0	draw	away	5	\N	\N	\N	\N
1747	2001-04-29	2001	112	4	3	win	away	5	\N	\N	\N	\N
1748	2001-05-02	2001	69	2	3	loss	home	5	\N	\N	\N	\N
1749	2001-05-06	2001	1	2	1	win	away	5	\N	\N	\N	\N
1751	2001-05-19	2001	44	2	0	win	home	5	\N	\N	\N	\N
1752	2001-05-28	2001	69	0	1	loss	away	5	\N	\N	\N	\N
1753	2001-06-03	2001	42	2	0	win	home	5	\N	\N	\N	\N
1754	2001-06-10	2001	143	1	4	loss	away	5	\N	\N	\N	\N
1755	2001-06-17	2001	112	1	1	draw	home	5	\N	\N	\N	\N
1756	2001-06-24	2001	1	0	2	loss	home	5	\N	\N	\N	\N
1757	2001-06-28	2001	69	1	0	win	home	5	\N	\N	\N	\N
1758	2001-07-01	2001	42	0	0	draw	away	5	\N	\N	\N	\N
1760	2001-07-08	2001	69	0	1	loss	away	5	\N	\N	\N	\N
1761	2001-07-12	2001	42	3	0	win	home	5	\N	\N	\N	\N
1763	2001-07-22	2001	42	1	1	draw	home	5	\N	\N	\N	\N
1764	2001-07-25	2001	42	0	1	loss	away	5	\N	\N	\N	\N
1765	2001-07-29	2001	42	1	2	loss	away	5	\N	\N	\N	\N
1766	2001-09-16	2001	131	2	3	loss	away	3	\N	\N	\N	\N
1767	2001-09-19	2001	42	3	1	win	away	3	\N	\N	\N	\N
1768	2001-09-23	2001	60	2	3	loss	home	3	\N	\N	\N	\N
1769	2001-09-26	2001	13	0	2	loss	home	3	\N	\N	\N	\N
1770	2001-09-30	2001	81	2	1	win	away	3	\N	\N	\N	\N
1771	2001-10-07	2001	13	0	1	loss	away	3	\N	\N	\N	\N
1772	2001-10-11	2001	60	0	3	loss	away	3	\N	\N	\N	\N
1773	2001-10-14	2001	42	0	2	loss	home	3	\N	\N	\N	\N
1774	2001-10-18	2001	131	1	0	win	home	3	\N	\N	\N	\N
1775	2001-10-28	2001	81	3	0	win	home	3	\N	\N	\N	\N
1587	2005-05-29	2005	135	7	0	win	away	14	\N	\N	\N	\N
1590	2005-07-03	2005	135	7	0	win	home	14	\N	\N	\N	\N
1466	2010-11-24	2010	5	1	2	loss	away	6	\N	\N	\N	\N
1467	2010-11-17	2010	11	2	4	loss	home	6	\N	\N	\N	\N
1479	2010-08-25	2010	9	0	0	draw	away	6	\N	\N	\N	\N
1481	2010-08-18	2010	41	3	1	win	home	6	\N	\N	\N	\N
1484	2010-08-04	2010	3	3	0	win	away	6	\N	\N	\N	\N
1486	2010-07-28	2010	8	1	1	draw	home	6	\N	\N	\N	\N
1489	2010-07-14	2010	97	0	1	loss	away	6	\N	\N	\N	\N
1490	2010-07-07	2010	5	4	1	win	home	6	\N	\N	\N	\N
1491	2010-07-04	2010	12	2	1	win	away	6	\N	\N	\N	\N
1492	2010-06-27	2010	1	2	2	draw	home	6	\N	\N	\N	\N
1493	2010-06-24	2010	4	1	6	loss	away	6	\N	\N	\N	\N
1494	2010-06-20	2010	138	1	1	draw	home	6	\N	\N	\N	\N
1495	2010-06-17	2010	7	3	2	win	away	6	\N	\N	\N	\N
1496	2010-06-13	2010	13	4	2	win	home	6	\N	\N	\N	\N
1497	2010-06-09	2010	6	2	1	win	away	6	\N	\N	\N	\N
1166	2023-01-05	2023	110	2	1	win	home	6	1	3	\N	\N
1167	2023-01-08	2023	12	0	0	draw	home	6	1	3	\N	\N
1253	2025-01-04	2025	67	1	0	win	home	6	1	3	\N	\N
1254	2025-01-08	2025	68	1	0	win	home	6	1	3	\N	\N
1214	2024-01-06	2024	117	1	1	draw	home	6	1	3	\N	\N
1036	2021-01-05	2021	86	0	0	draw	away	6	\N	14	\N	\N
1037	2021-01-26	2021	86	2	0	win	home	6	1	14	\N	\N
837	2017-08-15	2017	79	1	0	win	away	6	\N	3	\N	\N
838	2017-08-22	2017	79	4	0	win	home	6	1	3	\N	\N
1718	2002-01-27	2002	2	3	2	win	home	6	\N	\N	\N	\N
1727	2001-01-25	2001	2	0	0	draw	away	6	\N	\N	\N	\N
1741	2001-04-04	2001	2	3	4	loss	home	4	\N	\N	\N	\N
1742	2001-04-11	2001	2	1	0	win	away	4	\N	\N	\N	\N
1734	2001-03-04	2001	138	3	2	win	home	6	\N	\N	\N	\N
1581	2004-07-14	2004	84	1	0	win	home	14	\N	\N	\N	\N
1585	2005-05-01	2005	84	0	0	draw	home	14	\N	\N	\N	\N
1588	2005-06-05	2005	84	4	1	win	away	14	\N	\N	\N	\N
1342	2015-02-08	2015	85	1	1	draw	home	5	1	\N	\N	\N
1776	2015-02-01	2015	44	1	1	draw	away	5	\N	\N	\N	\N
1777	2015-03-01	2015	85	0	1	loss	away	5	\N	\N	\N	\N
1743	2001-03-29	2001	131	3	0	win	home	5	\N	\N	\N	\N
1750	2001-05-13	2001	131	1	3	loss	away	5	\N	\N	\N	\N
1759	2001-07-05	2001	131	2	0	win	home	5	\N	\N	\N	\N
1762	2001-07-15	2001	131	2	1	win	away	5	\N	\N	\N	\N
1778	2000-01-19	2000	2	0	2	loss	home	6	\N	\N	\N	\N
1779	2000-01-22	2000	154	2	2	draw	away	6	\N	\N	\N	\N
1780	2000-01-27	2000	9	0	0	draw	home	6	\N	\N	\N	\N
1781	2000-01-30	2000	9	0	3	loss	away	6	\N	\N	\N	\N
1782	2000-02-02	2000	154	1	2	loss	home	6	\N	\N	\N	\N
1783	2000-02-05	2000	2	1	6	loss	away	6	\N	\N	\N	\N
1784	2000-02-20	2000	130	0	0	draw	away	5	\N	\N	\N	\N
1785	2000-02-26	2000	143	1	1	draw	home	5	\N	\N	\N	\N
1786	2000-03-01	2000	44	2	2	draw	home	5	\N	\N	\N	\N
1787	2000-03-12	2000	135	4	1	win	away	5	\N	\N	\N	\N
1788	2000-03-15	2000	42	3	1	win	home	5	\N	\N	\N	\N
1789	2000-03-26	2000	131	2	1	win	away	5	\N	\N	\N	\N
1790	2000-04-02	2000	112	2	0	win	home	5	\N	\N	\N	\N
1791	2000-04-09	2000	1	1	2	loss	away	5	\N	\N	\N	\N
1792	2000-04-16	2000	130	8	0	win	home	5	\N	\N	\N	\N
1793	2000-04-19	2000	143	1	0	win	away	5	\N	\N	\N	\N
1794	2000-04-23	2000	44	2	0	win	away	5	\N	\N	\N	\N
1795	2000-04-30	2000	135	3	0	win	home	5	\N	\N	\N	\N
1796	2000-05-14	2000	42	0	0	draw	away	5	\N	\N	\N	\N
1797	2000-05-21	2000	131	1	0	win	home	5	\N	\N	\N	\N
1798	2000-05-28	2000	112	4	3	win	away	5	\N	\N	\N	\N
1799	2000-06-04	2000	1	1	1	draw	home	5	\N	\N	\N	\N
1800	2000-06-11	2000	44	2	0	win	away	5	\N	\N	\N	\N
1801	2000-06-15	2000	131	3	2	win	home	5	\N	\N	\N	\N
1802	2000-06-18	2000	42	0	1	loss	away	5	\N	\N	\N	\N
1803	2000-06-21	2000	44	0	1	loss	home	5	\N	\N	\N	\N
1804	2000-06-25	2000	131	3	2	win	home	5	\N	\N	\N	\N
1805	2000-06-29	2000	42	1	1	draw	home	5	\N	\N	\N	\N
1806	2000-07-02	2000	42	3	1	win	away	5	\N	\N	\N	\N
1807	2000-07-06	2000	42	1	2	loss	home	5	\N	\N	\N	\N
1808	2000-07-09	2000	42	0	1	loss	home	5	\N	\N	\N	\N
1809	2000-03-22	2000	3	1	2	loss	away	4	\N	\N	\N	\N
1810	2000-03-29	2000	3	0	1	loss	home	4	\N	\N	\N	\N
1811	2000-08-09	2000	99	1	2	loss	home	2	\N	\N	\N	\N
1812	2000-08-13	2000	11	3	1	win	away	2	\N	\N	\N	\N
1813	2000-08-16	2000	3	0	3	loss	away	2	\N	\N	\N	\N
1814	2000-08-20	2000	39	0	3	loss	home	2	\N	\N	\N	\N
1815	2000-08-23	2000	155	4	3	win	home	2	\N	\N	\N	\N
1816	2000-08-26	2000	8	0	1	loss	away	2	\N	\N	\N	\N
1817	2000-08-30	2000	74	3	2	win	home	2	\N	\N	\N	\N
1818	2000-09-04	2000	38	0	1	loss	away	2	\N	\N	\N	\N
1819	2000-09-07	2000	1	0	2	loss	home	2	\N	\N	\N	\N
1820	2000-09-10	2000	156	0	2	loss	away	2	\N	\N	\N	\N
1821	2000-09-13	2000	12	5	2	win	home	2	\N	\N	\N	\N
1822	2000-09-17	2000	7	1	1	draw	home	2	\N	\N	\N	\N
1823	2000-09-20	2000	157	1	1	draw	away	2	\N	\N	\N	\N
1824	2000-09-24	2000	158	1	0	win	home	2	\N	\N	\N	\N
1825	2000-09-27	2000	139	0	2	loss	home	2	\N	\N	\N	\N
1826	2000-10-04	2000	40	0	1	loss	away	2	\N	\N	\N	\N
1827	2000-10-07	2000	159	3	2	win	away	2	\N	\N	\N	\N
\.


--
-- Data for Name: opponents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.opponents (id, name) FROM stdin;
3	Náutico
4	Santa Cruz
5	Vitória
6	Bahia
7	Fortaleza
8	Ceará
9	Botafogo-PB
10	Campinense
11	ABC
12	América-RN
13	Confiança
14	Flamengo
15	Fluminense
16	Vasco
17	Botafogo
19	Palmeiras
20	São Paulo
21	Santos
22	Internacional
23	Grêmio
24	Athletico-PR
25	Atlético-MG
27	Goiás
28	Bragantino
29	Cuiabá
30	América-MG
31	Chapecoense
32	Avaí
33	Figueirense
34	Joinville
35	Coritiba
36	Paraná
37	Londrina
38	Sampaio Corrêa
39	Paysandu
40	Remo
41	Treze
48	Criciúma
49	Juventude
50	Ponte Preta
51	Anápolis
52	Ypiranga
53	Maringá
54	Tombense
55	São Bernardo
56	Floresta
57	Guarani
58	Caxias do Sul
59	Retrô
60	Itabaiana
61	Ituano
62	Brusque
63	Boavista
64	Tuna Luso
65	Ferroviário
66	Juazeirense
67	Barcelona de Ilhéus
68	Maracanã-CE
70	Aparecidense
71	Volta Redonda
72	Athletic Club
73	EC São José
74	Vila Nova
75	Operário
76	Novorizontino
79	Parnahyba
80	Guarani de Juazeiro
81	Central
82	Altos
83	São Bento
84	Sete de Setembro-AL
86	Moto Club
87	Salgueiro
88	Manaus FC
90	Oeste
92	Boa Esporte
93	GE Brasil
94	Atlético Goianiense
97	Sergipe
98	Mixto
99	River-PI
100	Vitória-ES
101	Frei Paulistano
102	Botafogo-SP
103	Brasil de Pelotas
104	4 de Julho
105	Guarany de Sobral
107	Sousa
108	Atlético-BA
109	Cruzeiro-AL
110	Potiguar
111	Fluminense-PI
115	Pouso Alegre
116	Amazonas FC
117	Iguatu
118	Ferroviária
121	Jacuipense
122	Lagarto-SE
125	Betim Futebol
129	Vitória da Conquista
130	Comercial-AL
131	Corinthians-AL
133	União-AL
134	Feirense
135	São Domingos-AL
137	São Luíz-AL
139	Serra
141	Itabuna
142	Catuense
150	Lagartense
151	Colo Colo-BA
2	Sport-PE
138	Fluminense-BA
126	São Luiz de Ijuí-RS
148	América-AL
18	Corinthians-SP
26	Cruzeiro-MG
1	CRB-AL
42	ASA-AL
43	CSE-AL
44	Murici-AL
45	Coruripe-AL
46	Jaciobá-AL
69	Penedense-AL
77	Ipanema-AL
78	Santa Rita-AL
85	CEO-AL
89	Dimensão Saúde-AL
106	Desportivo Aliança-AL
112	Miguelense-AL
113	Zumbi-AL
119	Igaci-AL
120	Murici Sport-AL
132	Sport Atalaia-AL
136	Igreja Nova-AL
140	Capelense-AL
143	Capela-AL
144	Bom Jesus-AL
146	Bandeirante-AL
149	Teotônio-AL
154	Poções-BA
155	Nacional-AM
156	São Raimundo-AM
157	Desportiva-ES
158	Anapolina-GO
159	Bandeirante-DF
\.


--
-- Data for Name: player_season_stats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.player_season_stats (id, player_id, season, appearances, goals, assists) FROM stdin;
93	69	2016	13	3	0
94	73	2016	4	0	0
95	104	2016	10	0	0
96	57	2016	18	1	0
97	7	2016	14	2	0
98	75	2016	3	0	0
99	123	2016	5	0	0
100	112	2016	26	4	0
101	87	2016	29	11	0
102	84	2016	15	4	0
103	61	2016	5	0	0
104	117	2016	11	0	0
105	105	2016	21	3	0
106	99	2016	32	4	0
107	82	2016	33	0	0
108	67	2016	1	0	0
109	101	2016	8	1	0
110	121	2016	9	3	0
111	5	2016	26	6	0
112	59	2016	31	4	0
113	114	2016	1	0	0
114	113	2016	10	0	0
115	88	2016	15	0	0
116	51	2016	2	0	0
117	23	2016	28	0	0
118	78	2016	12	0	0
119	52	2016	4	0	0
120	110	2016	2	0	0
121	115	2016	22	2	0
122	95	2016	3	0	0
123	83	2016	10	0	0
124	77	2016	11	4	0
125	102	2016	10	3	0
126	100	2016	16	7	0
127	58	2016	9	1	0
128	103	2016	3	0	0
129	81	2016	3	0	0
130	72	2016	6	1	0
131	98	2016	6	1	0
132	54	2016	3	0	0
133	59	2017	30	0	0
134	88	2017	8	0	0
135	68	2017	40	2	0
136	104	2017	27	14	0
137	97	2017	2	0	0
138	58	2017	19	0	0
139	120	2017	1	0	0
140	62	2017	37	0	0
141	64	2017	6	1	0
142	66	2017	8	0	0
143	112	2017	22	0	0
144	93	2017	2	0	0
145	70	2017	17	2	0
146	56	2017	13	1	0
147	23	2017	31	2	0
148	115	2017	9	0	0
149	90	2017	5	0	0
150	5	2017	38	3	0
151	79	2017	3	0	0
152	80	2017	3	0	0
153	107	2017	33	4	0
154	87	2017	19	4	0
155	86	2017	13	0	0
156	60	2017	6	1	0
157	78	2017	38	2	0
158	108	2017	35	2	0
159	94	2017	14	2	0
160	92	2017	7	1	0
161	118	2017	1	0	0
162	109	2017	2	0	0
163	55	2017	23	8	0
164	96	2017	5	1	0
165	82	2017	12	0	0
166	113	2017	4	0	0
167	74	2017	21	1	0
168	65	2017	10	1	0
169	116	2017	8	0	0
170	91	2017	4	0	0
171	76	2017	22	1	0
172	119	2017	17	2	0
173	89	2017	8	1	0
174	63	2017	14	0	0
175	53	2017	40	7	0
176	111	2017	4	0	0
177	85	2017	7	0	0
178	71	2017	1	0	0
179	106	2017	16	1	0
180	122	2017	17	3	0
181	100	2017	10	2	0
182	62	2018	17	0	0
183	138	2018	12	0	0
184	108	2018	49	2	0
185	52	2018	38	0	0
186	134	2018	13	4	0
187	74	2018	13	1	0
188	159	2018	4	0	0
189	135	2018	1	0	0
190	155	2018	7	0	0
191	147	2018	11	1	0
192	143	2018	14	1	0
193	111	2018	17	0	0
194	144	2018	6	0	0
195	141	2018	14	3	0
196	130	2018	5	0	0
197	68	2018	32	1	0
198	157	2018	1	0	0
199	154	2018	42	0	0
200	127	2018	9	0	0
201	59	2018	47	5	0
202	139	2018	1	0	0
203	129	2018	11	0	0
204	89	2018	2	0	0
205	23	2018	44	2	0
206	149	2018	17	2	0
207	124	2018	27	4	0
208	125	2018	4	0	0
209	70	2018	13	1	0
210	145	2018	13	2	0
211	156	2018	14	1	0
212	78	2018	5	0	0
213	53	2018	50	9	0
214	152	2018	3	0	0
215	5	2018	52	13	0
216	148	2018	14	0	0
217	137	2018	12	5	0
218	133	2018	8	0	0
219	132	2018	1	0	0
220	161	2018	18	1	0
221	61	2018	15	2	0
222	60	2018	9	1	0
223	153	2018	1	0	0
224	86	2018	5	0	0
225	131	2018	9	0	0
226	55	2018	27	6	0
227	158	2018	2	0	0
228	151	2018	9	1	0
229	150	2018	7	2	0
230	146	2018	14	0	0
231	160	2018	4	0	0
232	142	2018	4	0	0
233	140	2018	1	0	0
234	136	2018	7	0	0
235	128	2018	18	0	0
236	126	2018	19	2	0
237	17	2019	26	1	0
238	175	2019	1	0	0
239	198	2019	2	0	0
240	202	2019	3	0	0
241	186	2019	7	0	0
242	181	2019	23	4	0
243	168	2019	1	0	0
244	201	2019	8	2	0
245	165	2019	11	0	0
246	59	2019	2	0	0
247	178	2019	7	0	0
248	23	2019	22	1	0
249	169	2019	6	0	0
250	158	2019	4	0	0
251	173	2019	1	0	0
252	166	2019	30	0	0
253	191	2019	2	0	0
254	199	2019	4	0	0
255	162	2019	20	2	0
256	105	2019	24	0	0
257	196	2019	9	2	0
258	183	2019	5	1	0
259	180	2019	1	0	0
260	189	2019	6	0	0
261	187	2019	2	0	0
262	176	2019	7	0	0
263	188	2019	24	9	0
264	184	2019	6	0	0
265	171	2019	26	0	0
266	18	2019	42	5	0
267	174	2019	52	0	0
268	192	2019	26	5	0
269	185	2019	7	0	0
270	21	2019	12	1	0
271	167	2019	7	1	0
272	108	2019	24	0	0
273	68	2019	51	1	0
274	200	2019	13	0	0
275	163	2019	26	4	0
276	197	2019	2	0	0
277	24	2019	20	0	0
278	164	2019	31	2	0
279	179	2019	16	0	0
280	170	2019	11	2	0
281	193	2019	12	1	0
282	172	2019	19	1	0
283	203	2019	12	0	0
284	190	2019	29	0	0
285	182	2019	11	1	0
286	140	2019	1	0	0
287	79	2019	17	1	0
288	5	2019	33	3	0
289	194	2019	25	0	0
290	139	2019	22	3	0
291	177	2019	1	0	0
292	134	2019	9	0	0
293	195	2019	6	0	0
294	232	2020	11	0	0
295	32	2020	16	0	0
296	235	2020	9	1	0
297	205	2020	18	0	0
298	238	2020	27	10	0
299	212	2020	8	0	0
300	211	2020	40	4	0
301	214	2020	16	1	0
302	213	2020	1	0	0
303	225	2020	14	0	0
304	222	2020	1	0	0
305	139	2020	15	1	0
306	162	2020	9	1	0
307	215	2020	32	1	0
308	204	2020	3	0	0
309	55	2020	12	2	0
310	47	2020	40	1	0
311	1	2020	50	10	0
312	220	2020	28	0	0
313	219	2020	21	5	0
314	216	2020	47	5	0
315	230	2020	37	4	0
316	86	2020	3	0	0
317	221	2020	12	1	0
318	227	2020	1	0	0
319	223	2020	27	5	0
320	187	2020	11	0	0
321	7	2020	5	0	0
322	236	2020	26	1	0
323	17	2020	21	2	0
324	228	2020	14	1	0
325	105	2020	12	1	0
326	59	2020	11	0	0
327	234	2020	5	0	0
328	218	2020	2	0	0
329	206	2020	4	0	0
330	40	2020	16	1	0
331	37	2020	45	0	0
332	233	2020	9	0	0
333	208	2020	5	0	0
334	174	2020	49	3	0
335	226	2020	7	0	0
336	229	2020	26	2	0
337	210	2020	3	0	0
338	237	2020	4	1	0
339	209	2020	25	5	0
340	172	2020	2	0	0
341	231	2020	13	0	0
342	23	2020	37	2	0
343	183	2020	4	0	0
344	224	2020	29	2	0
345	207	2020	1	0	0
346	111	2020	2	0	0
347	217	2020	1	0	0
348	257	2021	1	0	0
349	263	2021	16	0	0
350	255	2021	45	11	0
351	128	2021	8	0	0
352	241	2021	5	0	0
353	266	2021	1	0	0
354	258	2021	7	1	0
355	227	2021	5	0	0
356	47	2021	54	2	0
357	250	2021	4	0	0
358	45	2021	28	4	0
359	274	2021	25	0	0
360	207	2021	6	0	0
361	271	2021	7	0	0
362	235	2021	10	1	0
363	261	2021	1	0	0
364	30	2021	21	0	0
365	267	2021	4	0	0
366	260	2021	21	0	0
367	9	2021	55	4	0
368	252	2021	3	0	0
369	249	2021	4	0	0
370	247	2021	13	0	0
371	243	2021	2	0	0
372	268	2021	22	1	0
373	205	2021	40	0	0
374	32	2021	53	6	0
375	262	2021	1	0	0
376	215	2021	20	2	0
377	187	2021	2	0	0
378	217	2021	4	0	0
379	154	2021	29	3	0
380	265	2021	19	0	0
381	222	2021	9	0	0
382	244	2021	2	0	0
383	229	2021	16	1	0
384	248	2021	3	0	0
385	256	2021	3	0	0
386	5	2021	7	0	0
387	7	2021	5	0	0
388	270	2021	3	0	0
389	63	2021	1	0	0
390	264	2021	22	1	0
391	218	2021	6	0	0
392	253	2021	24	1	0
393	269	2021	6	0	0
394	240	2021	3	0	0
395	272	2021	3	0	0
396	259	2021	5	0	0
397	254	2021	32	3	0
398	141	2021	21	0	0
399	239	2021	42	1	0
400	1	2021	16	2	0
401	136	2021	17	0	0
402	230	2021	12	0	0
403	246	2021	45	7	0
404	213	2021	7	0	0
405	242	2021	15	0	0
406	245	2021	45	10	0
407	273	2021	14	0	0
408	251	2021	15	2	0
409	15	2021	52	24	0
410	242	2022	4	0	0
411	290	2022	2	0	0
412	222	2022	1	0	0
413	281	2022	2	0	0
414	293	2022	27	0	0
415	40	2022	21	1	0
416	295	2022	5	0	0
417	288	2022	56	0	0
418	285	2022	36	0	0
419	298	2022	7	0	0
420	294	2022	32	2	0
421	277	2022	1	0	0
422	93	2022	6	0	0
423	5	2022	28	6	0
424	291	2022	34	3	0
425	47	2022	48	2	0
426	265	2022	5	0	0
427	280	2022	7	0	0
428	289	2022	8	1	0
429	304	2022	9	0	0
430	264	2022	23	0	0
431	141	2022	42	3	0
432	284	2022	23	1	0
433	9	2022	35	1	0
434	302	2022	7	0	0
435	303	2022	33	0	0
436	282	2022	35	3	0
437	276	2022	47	3	0
438	37	2022	43	0	0
439	292	2022	13	0	0
440	296	2022	20	3	0
441	286	2022	18	3	0
442	279	2022	6	0	0
443	271	2022	1	0	0
444	287	2022	15	0	0
445	246	2022	29	5	0
446	218	2022	2	0	0
447	300	2022	11	0	0
448	299	2022	49	12	0
449	278	2022	3	0	0
450	248	2022	42	4	0
451	283	2022	18	1	0
452	32	2022	48	0	0
453	12	2022	14	2	0
454	301	2022	2	0	0
455	256	2022	51	20	0
456	245	2022	14	0	0
457	297	2022	8	0	0
458	275	2022	11	0	0
459	358	2023	20	2	0
460	324	2023	2	0	0
461	308	2023	1	0	0
462	301	2023	7	0	0
463	337	2023	8	1	0
465	93	2023	12	0	0
466	331	2023	1	0	0
467	306	2023	21	0	0
468	216	2023	15	0	0
469	317	2023	18	0	0
470	323	2023	1	0	0
471	310	2023	3	0	0
472	222	2023	3	0	0
473	264	2023	14	0	0
474	340	2023	1	0	0
475	315	2023	13	0	0
476	352	2023	6	0	0
477	327	2023	16	2	0
478	360	2023	13	1	0
479	341	2023	1	0	0
480	326	2023	40	8	0
481	319	2023	3	0	0
482	307	2023	2	0	0
483	353	2023	21	1	0
484	350	2023	3	0	0
485	314	2023	4	1	0
486	336	2023	1	0	0
487	338	2023	3	0	0
488	347	2023	19	3	0
489	292	2023	1	0	0
490	342	2023	3	0	0
491	283	2023	9	1	0
492	313	2023	13	1	0
493	335	2023	3	0	0
494	332	2023	2	0	0
495	345	2023	33	0	0
496	213	2023	9	0	0
497	242	2023	3	0	0
498	265	2023	24	0	0
499	318	2023	6	0	0
500	361	2023	4	0	0
501	316	2023	19	0	0
502	309	2023	12	0	0
503	351	2023	21	1	0
504	328	2023	6	0	0
505	322	2023	10	1	0
506	359	2023	6	0	0
507	325	2023	1	0	0
508	349	2023	38	0	0
509	256	2023	3	0	0
510	355	2023	6	1	0
511	40	2023	18	0	0
512	321	2023	6	0	0
513	320	2023	8	1	0
514	329	2023	2	0	0
515	107	2023	10	1	0
516	356	2023	3	0	0
517	346	2023	5	0	0
518	312	2023	16	2	0
519	311	2023	10	2	0
520	357	2023	18	0	0
521	348	2023	19	7	0
522	343	2023	12	0	0
523	305	2023	20	0	0
524	339	2023	1	0	0
525	333	2023	8	0	0
526	227	2023	17	0	0
527	52	2023	19	2	0
528	354	2023	2	0	0
529	344	2023	15	0	0
530	334	2023	6	0	0
531	330	2023	1	0	0
532	108	2023	16	1	0
533	367	2024	34	18	0
534	370	2024	19	0	0
535	390	2024	3	0	0
536	373	2024	5	0	0
537	374	2024	11	0	0
538	399	2024	10	1	0
539	364	2024	4	0	0
540	359	2024	9	1	0
541	363	2024	4	1	0
542	290	2024	1	0	0
543	378	2024	11	0	0
544	383	2024	1	0	0
545	375	2024	1	0	0
546	403	2024	5	0	0
547	372	2024	11	0	0
548	105	2024	18	0	0
549	396	2024	7	0	0
550	366	2024	4	0	0
551	371	2024	10	0	0
552	357	2024	1	0	0
553	405	2024	22	6	0
554	229	2024	22	4	0
555	308	2024	1	0	0
556	377	2024	18	0	0
557	369	2024	17	1	0
558	379	2024	6	0	0
559	389	2024	4	0	0
560	380	2024	11	1	0
561	382	2024	5	0	0
562	401	2024	3	0	0
563	365	2024	11	0	0
564	149	2024	4	1	0
566	282	2024	26	1	0
567	362	2024	4	0	0
568	402	2024	9	0	0
569	307	2024	1	0	0
570	404	2024	31	0	0
571	387	2024	14	0	0
572	400	2024	10	1	0
573	385	2024	8	0	0
574	407	2024	16	0	0
575	406	2024	15	3	0
576	391	2024	1	0	0
577	343	2024	3	1	0
579	397	2024	6	0	0
580	392	2024	3	0	0
581	368	2024	4	0	0
582	393	2024	12	0	0
583	394	2024	1	0	0
584	395	2024	21	2	0
585	388	2024	11	0	0
586	227	2024	16	1	0
587	398	2024	10	1	0
588	376	2024	15	2	0
589	350	2024	7	0	0
590	340	2024	1	0	0
591	334	2024	22	0	0
592	384	2024	12	1	0
593	381	2024	11	0	0
594	386	2024	3	0	0
595	423	2025	45	8	0
596	417	2025	1	0	0
597	448	2025	9	0	0
598	330	2025	4	0	0
600	422	2025	28	0	0
601	427	2025	1	0	0
602	407	2025	5	0	0
603	447	2025	3	0	0
604	254	2025	29	1	0
605	424	2025	8	0	0
606	438	2025	6	2	0
607	444	2025	14	0	0
608	273	2025	9	0	0
609	431	2025	5	0	0
610	308	2025	6	0	0
611	372	2025	1	0	0
612	420	2025	2	0	0
613	425	2025	3	0	0
614	411	2025	26	0	0
615	449	2025	15	0	0
616	415	2025	6	1	0
617	451	2025	2	0	0
618	413	2025	21	1	0
619	371	2025	44	1	0
620	436	2025	3	0	0
621	440	2025	7	2	0
622	40	2025	17	0	0
623	416	2025	42	10	0
624	408	2025	3	0	0
625	443	2025	1	0	0
626	434	2025	20	0	0
627	428	2025	9	0	0
628	399	2025	17	0	0
629	387	2025	10	0	0
630	433	2025	7	0	0
631	398	2025	18	0	0
632	323	2025	1	0	0
633	412	2025	19	2	0
634	378	2025	35	6	0
635	355	2025	5	0	0
636	418	2025	17	0	0
637	426	2025	5	0	0
638	450	2025	8	0	0
639	441	2025	17	0	0
640	437	2025	11	2	0
641	432	2025	35	1	0
642	442	2025	2	0	0
643	445	2025	6	0	0
644	419	2025	5	0	0
645	394	2025	2	0	0
646	430	2025	24	0	0
647	439	2025	41	3	0
648	435	2025	15	1	0
649	446	2025	3	0	0
650	404	2025	3	0	0
651	383	2025	20	2	0
652	421	2025	8	0	0
653	414	2025	43	4	0
654	429	2025	3	0	0
655	410	2025	7	0	0
656	409	2025	5	0	0
657	367	2025	41	17	0
658	329	2025	6	0	0
659	469	2026	8	0	0
660	453	2026	22	1	0
661	463	2026	22	2	0
662	465	2026	1	0	0
663	455	2026	18	0	0
664	436	2026	2	0	0
665	456	2026	6	1	0
667	415	2026	3	0	0
668	473	2026	6	1	0
669	459	2026	2	1	0
670	435	2026	14	0	0
671	432	2026	12	2	0
672	475	2026	1	0	0
673	481	2026	2	0	0
674	472	2026	2	0	0
675	462	2026	9	2	0
676	71	2026	9	1	0
677	466	2026	14	0	0
679	454	2026	16	0	0
680	410	2026	2	0	0
666	486	2026	14	0	0
681	483	2026	22	5	0
682	479	2026	3	0	0
683	457	2026	13	1	0
684	474	2026	5	2	0
685	452	2026	4	0	0
686	482	2026	5	0	0
687	447	2026	9	3	0
688	409	2026	1	0	0
689	470	2026	10	0	0
690	460	2026	26	15	0
691	478	2026	3	0	0
692	476	2026	7	2	0
693	471	2026	21	0	0
694	461	2026	3	0	0
695	308	2026	8	0	0
696	440	2026	5	0	0
697	484	2026	21	2	0
698	433	2026	9	3	0
699	464	2026	20	4	0
700	480	2026	10	1	0
701	477	2026	2	0	0
702	468	2026	10	2	0
703	467	2026	3	0	0
704	104	2026	1	0	0
705	458	2026	12	1	0
707	485	1991	10	0	0
708	485	1992	10	0	0
709	485	1993	10	0	0
710	485	1994	10	0	0
711	485	1995	8	0	0
712	485	2012	20	0	0
713	485	2013	22	0	0
706	53	2014	20	6	0
714	487	1993	0	14	0
715	487	1994	0	16	0
716	487	1995	0	13	0
717	487	2010	0	4	0
718	488	2000	0	8	0
719	488	2001	0	9	0
720	488	2002	0	10	0
721	488	2006	0	5	0
722	488	2007	0	3	0
723	489	2001	0	7	0
724	489	2002	0	8	0
725	489	2003	0	7	0
726	489	2006	0	3	0
727	489	2007	0	1	0
739	491	2008	0	8	0
740	491	2010	0	7	0
741	491	2012	0	4	0
742	492	2023	25	3	0
743	493	2024	8	3	0
744	493	2025	20	3	1
745	493	2026	13	2	0
746	490	histórico	0	77	0
747	494	histórico	0	68	0
748	495	histórico	0	56	0
749	496	histórico	0	49	0
750	497	histórico	0	48	0
751	498	histórico	0	46	0
752	499	histórico	0	44	0
753	500	histórico	0	41	0
754	501	histórico	0	38	0
\.


--
-- Data for Name: players; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.players (id, name, "position", nationality, birth_year) FROM stdin;
51	Ronaldo Caetano	MF	\N	\N
52	Xandão	DF	\N	\N
53	Daniel Costa	MF	\N	\N
54	Thiago Santos	MF	\N	\N
55	Michel Douglas	FW	\N	\N
56	Dick	DF	\N	\N
57	Henrique Choco	DF	\N	\N
58	Rayro	DF	\N	\N
59	Leandro Souza	DF	\N	\N
60	Rodrigo Lobão	DF	\N	\N
61	Walter	DF	\N	\N
62	Willis Mota	GK	\N	\N
63	Raul	DF	\N	\N
64	Daniel Cruz	FW	\N	\N
65	Gustavinho	FW	\N	\N
66	Mateus Lima	DF	\N	\N
67	Tiago Chulapa	FW	\N	\N
68	Dawhan	MF	\N	\N
69	David Dener	FW	\N	\N
70	Edinho	MF	\N	\N
71	Lucas Silva	DF	\N	\N
72	Azul	FW	\N	\N
73	Washington	MF	\N	\N
74	Boquita	MF	\N	\N
75	Escobar	MF	\N	\N
76	Thiago Potiguar	FW	\N	\N
77	Rafael Oliveira	FW	\N	\N
78	Marcos Antônio	MF	\N	\N
79	Cassiano	FW	\N	\N
80	Cristiano	MF	\N	\N
81	Pantera	GK	\N	\N
82	Jeferson	GK	\N	\N
83	Hudson	DF	\N	\N
84	Jônatas Obina	FW	\N	\N
85	Rosinei	MF	\N	\N
86	Caíque	MF	\N	\N
87	Cleyton Lima	MF	\N	\N
88	Denilson	DF	\N	\N
89	Maxuell Samurai	FW	\N	\N
90	Francisco Alex	MF	\N	\N
91	Michel Schmöller	MF	\N	\N
92	Daniel Angulo	FW	\N	\N
93	Jonathan	FW	\N	\N
94	Alex Henrique	MF	\N	\N
95	Sorin	MF	\N	\N
96	Geovani	MF	\N	\N
97	Serginho	MF	\N	\N
98	Leandro Cardoso	DF	\N	\N
99	Bismarck	MF	\N	\N
100	Luís Soares	FW	\N	\N
101	Katê	MF	\N	\N
102	Marcelo Nicácio	FW	\N	\N
103	Santa Rosa	DF	\N	\N
104	Everton Heleno	MF	\N	\N
105	Jean Cléber	MF	\N	\N
106	Jorge Fellipe	DF	\N	\N
107	Thales	DF	\N	\N
108	Celsinho	DF	\N	\N
109	Luís Maranhão	FW	\N	\N
110	Elizeu	MF	\N	\N
111	Alexandre Cajuru	GK	\N	\N
112	Douglas Marques	DF	\N	\N
113	Kelvin	MF	\N	\N
114	Zé Romário	DF	\N	\N
115	Panda	DF	\N	\N
116	Jeam	FW	\N	\N
117	Jefferson Maranhense	FW	\N	\N
118	Joãozinho	MF	\N	\N
119	Vanger	FW	\N	\N
120	Giancarlo	FW	\N	\N
121	Kauhan	FW	\N	\N
122	Jacó	FW	\N	\N
123	David Oliveira	MF	\N	\N
124	Hugo Cabral	FW	\N	\N
125	Joílson	MF	\N	\N
126	Eduardo Echeverría	MF	\N	\N
127	Paulinho	DF	\N	\N
128	Lucas Frigeri	GK	\N	\N
129	Taiberson	FW	\N	\N
130	Velicka	DF	\N	\N
131	John Lennon	DF	\N	\N
132	Elly	FW	\N	\N
133	Felipe Garcia	GK	\N	\N
134	Jhon Cley	MF	\N	\N
135	Charles	MF	\N	\N
136	Yago	FW	\N	\N
137	Neto Berola	FW	\N	\N
138	Alemão Júnior	FW	\N	\N
139	Victor Paraíba	FW	\N	\N
140	Vital	DF	\N	\N
141	Giva	FW	\N	\N
142	Pingo	FW	\N	\N
143	Pio	MF	\N	\N
144	Talisson Calcinha	DF	\N	\N
145	Matheus Lopes	DF	\N	\N
146	Roger	DF	\N	\N
147	Bruno Veiga	FW	\N	\N
148	Ferrugem	MF	\N	\N
149	Niltinho	FW	\N	\N
150	Leandro Kivel	FW	\N	\N
151	Josimar	FW	\N	\N
152	Wellington Silva	DF	\N	\N
153	Da Silva	MF	\N	\N
154	Yuri Lara	MF	\N	\N
155	Elivelton	DF	\N	\N
156	Rubens	FW	\N	\N
157	Daniel Alagoano	MF	\N	\N
158	Rony Fernandes	DF	\N	\N
159	Judivan	FW	\N	\N
160	Muriel	DF	\N	\N
161	Juan	MF	\N	\N
162	Alecsandro	FW	\N	\N
163	Matheus Sávio	MF	\N	\N
164	Carlinhos	DF	\N	\N
165	Mauro Silva	MF	\N	\N
166	João Carlos	GK	\N	\N
167	Lohan	FW	\N	\N
168	Cristian Maidana	MF	\N	\N
169	Gersinho	FW	\N	\N
170	Andrés Escobar	FW	\N	\N
171	Gerson	DF	\N	\N
172	Héctor Bustamante	FW	\N	\N
173	Lucca Motta	MF	\N	\N
174	Luciano Castán	DF	\N	\N
175	Jhonnatan	MF	\N	\N
176	Alisson Safira	FW	\N	\N
177	Léo Santos	MF	\N	\N
178	Bruno Ramires	MF	\N	\N
179	Euller Silva	MF	\N	\N
180	Igo Gabriel	GK	\N	\N
181	Ricardo Bueno	FW	\N	\N
182	Maranhão	FW	\N	\N
183	Jarro Pedroso	FW	\N	\N
184	Amaral	MF	\N	\N
185	Madson	MF	\N	\N
186	Ramon	FW	\N	\N
187	Lucas Dias	DF	\N	\N
188	Patrick Fabiano	FW	\N	\N
189	Pedro Rosa	DF	\N	\N
190	Jordi	GK	\N	\N
191	Rodolfo Gamarra	FW	\N	\N
192	Jonathan Gómez	MF	\N	\N
193	Ronaldo Alves	DF	\N	\N
194	Naldo	MF	\N	\N
195	Hiago Ramiro	FW	\N	\N
196	Robinho	FW	\N	\N
197	Matheus Prado	FW	\N	\N
198	Fabrício Santana	GK	\N	\N
199	Pablo Armero	DF	\N	\N
200	Warley	FW	\N	\N
201	Régis Souza	DF	\N	\N
202	Joazi	DF	\N	\N
203	Bruno Alves	FW	\N	\N
204	Netto	FW	\N	\N
205	Thiago Rodrigues	GK	\N	\N
206	Willian Rocha	DF	\N	\N
207	Cantionilo	DF	\N	\N
208	Schutz	FW	\N	\N
209	Pedro Lucas	FW	\N	\N
210	Ignácio	DF	\N	\N
211	Rafael Bilu	FW	\N	\N
212	Bruno Grassi	GK	\N	\N
213	João Victor	MF	\N	\N
214	Rone	FW	\N	\N
215	Norberto	DF	\N	\N
216	Yago Henrique	MF	\N	\N
217	Bruno Tesouro	MF	\N	\N
218	Wallace	MF	\N	\N
219	Pedro Júnior	FW	\N	\N
220	Matheus Mendes	GK	\N	\N
221	Richard Franco	MF	\N	\N
222	Tito	DF	\N	\N
223	Allano	FW	\N	\N
224	Andrigo	MF	\N	\N
225	Márcio Araújo	MF	\N	\N
226	Rodrigo Andrade	MF	\N	\N
227	Almir Luan	DF	\N	\N
228	Renatinho	MF	\N	\N
229	Marquinhos	MF	\N	\N
230	Nádson	MF	\N	\N
231	Igor Fernandes	DF	\N	\N
232	Diego Maurício	FW	\N	\N
233	Bruno José	FW	\N	\N
234	Caio Felipe	DF	\N	\N
235	Rodolfo Filemon	DF	\N	\N
236	Cleberson	DF	\N	\N
237	Gustavo Hebling	MF	\N	\N
238	Paulo Sérgio	FW	\N	\N
239	Matheus Felipe	DF	\N	\N
240	Alisson	MF	\N	\N
241	Dudu Beberibe	FW	\N	\N
242	Gabriel Tonini	MF	\N	\N
243	Nilson	FW	\N	\N
244	Andrey Rafael	MF	\N	\N
245	Bruno Mota	MF	\N	\N
246	Marco Túlio	FW	\N	\N
247	Darley	GK	\N	\N
248	Yann Rolim	MF	\N	\N
249	João	MF	\N	\N
250	Athirson	DF	\N	\N
251	Fabrício	DF	\N	\N
252	Ryan Gonzales	FW	\N	\N
253	Reinaldo	FW	\N	\N
254	Silas	MF	\N	\N
255	Iury Castilho	FW	\N	\N
256	Rodrigo Rodrigues	FW	\N	\N
257	Montanhas	GK	\N	\N
258	Wellington	DF	\N	\N
259	Zé do Carmo	MF	\N	\N
260	Vitor Costa	DF	\N	\N
261	Wykley	FW	\N	\N
262	Pedrinho	DF	\N	\N
263	Ítalo	MF	\N	\N
264	Ernandes	DF	\N	\N
265	Éverton Silva	DF	\N	\N
266	Vinicius José	MF	\N	\N
267	Patrick Brey	DF	\N	\N
268	Silvinho	MF	\N	\N
269	Ewerthon	DF	\N	\N
270	Gustavo Martins	MF	\N	\N
271	Clayton	FW	\N	\N
272	Fernando Ferro	MF	\N	\N
273	Kevyn	DF	\N	\N
274	Aylon	FW	\N	\N
275	Rogério	FW	\N	\N
276	Osvaldo	FW	\N	\N
277	Léo Carvalho	MF	\N	\N
278	Anderson Martins	DF	\N	\N
279	Sassá	FW	\N	\N
280	Rickson	MF	\N	\N
281	Bruno Paulista	MF	\N	\N
282	Lucas Marques	DF	\N	\N
283	Douglas	DF	\N	\N
284	Luiz Beserra	MF	\N	\N
285	Igor Inocêncio	DF	\N	\N
286	Marcel Scalese	DF	\N	\N
287	Bruno Mezenga	FW	\N	\N
288	Marcelo Carné	GK	\N	\N
289	Héctor Canteros	MF	\N	\N
290	Denílson	DF	\N	\N
291	Werley	DF	\N	\N
292	William	MF	\N	\N
293	Wellington Nascimento	DF	\N	\N
294	Lourenço	MF	\N	\N
295	Lucas Lourenço	MF	\N	\N
296	Dalberto	FW	\N	\N
297	Ferreira	MF	\N	\N
298	Guilherme Paraíba	DF	\N	\N
299	Lucas Barcelos	FW	\N	\N
300	Edson Lucas	DF	\N	\N
301	Paulo Ricardo	GK	\N	\N
302	Jean	GK	\N	\N
303	Felipe Augusto	FW	\N	\N
304	John Mercado	FW	\N	\N
305	Moisés Ribeiro	MF	\N	\N
306	Rafael Forster	DF	\N	\N
307	José Cleverton	MF	\N	\N
308	Wesley	DF	\N	\N
309	William Oliveira	MF	\N	\N
310	Gabriel Oliveira	DF	\N	\N
311	Jean Carlo	FW	\N	\N
312	João Felipe	FW	\N	\N
313	Luis Felipe	FW	\N	\N
314	Júnior Todinho	FW	\N	\N
315	Geovane Silva	MF	\N	\N
316	Rhuan	DF	\N	\N
317	Ednei	DF	\N	\N
318	Lucas Ryan	DF	\N	\N
319	Pedrão	MF	\N	\N
320	Marciel	MF	\N	\N
321	Ray Vanegas	FW	\N	\N
322	Rodriguinho	FW	\N	\N
323	Giresse	DF	\N	\N
324	Matheus Lima	FW	\N	\N
325	Eduardo Jacone	DF	\N	\N
326	Tomas Bastos	MF	\N	\N
327	Jô	FW	\N	\N
328	Vitão	MF	\N	\N
329	Vinicius Toledo	MF	\N	\N
330	Kauã	DF	\N	\N
331	Alex Matheus	DF	\N	\N
332	Abner Vinicius	FW	\N	\N
333	Rodolfo	MF	\N	\N
334	Erik	MF	\N	\N
335	Rhayner	MF	\N	\N
336	Victor Ramalho	DF	\N	\N
337	Dedé	FW	\N	\N
338	Ramires	MF	\N	\N
339	Fabrício Santos	MF	\N	\N
340	Mateus Santos	DF	\N	\N
341	Kleiton	MF	\N	\N
342	Vinicius Peixoto	FW	\N	\N
343	Guilherme Rend	MF	\N	\N
344	Arnaldo	DF	\N	\N
345	Bruno Matias	MF	\N	\N
346	Pedro Victor	MF	\N	\N
347	Kaio Nunes	FW	\N	\N
348	Gabriel Taliari	MF	\N	\N
349	Dalberson	GK	\N	\N
350	Eduardo	GK	\N	\N
351	Ruan	FW	\N	\N
352	Moisés Gaúcho	MF	\N	\N
353	Iago Teles	FW	\N	\N
354	Gabryel	DF	\N	\N
355	Elvis	FW	\N	\N
356	Erick Melo	MF	\N	\N
357	Paulo César	DF	\N	\N
358	Thiaguinho	FW	\N	\N
359	Jefferson Oliveira	FW	\N	\N
360	Pará	DF	\N	\N
361	Wenderson	FW	\N	\N
362	Ricardo Sena	DF	\N	\N
363	Bruno Cardoso	DF	\N	\N
364	Jean Pierre	DF	\N	\N
365	Kevin	DF	\N	\N
366	Caio Vitor	MF	\N	\N
367	Tiago Marques	FW	\N	\N
368	Thiago Lopes	DF	\N	\N
369	Vitor Leque	FW	\N	\N
370	Marlon	MF	\N	\N
371	Gustavo Nicola	MF	\N	\N
372	Matheus Santos	DF	\N	\N
373	Calebe Costa	MF	\N	\N
374	Deivity	GK	\N	\N
375	Ismael Nunes	DF	\N	\N
376	Alisson Farias	FW	\N	\N
377	Pedro Favela	MF	\N	\N
378	Brayann	MF	\N	\N
379	Allyson	MF	\N	\N
380	Richard	FW	\N	\N
381	Guilherme Dal Pian	DF	\N	\N
382	Douglas Skilo	FW	\N	\N
383	Álvaro	MF	\N	\N
384	Vinicius Popó	FW	\N	\N
385	Thomazella	GK	\N	\N
386	Roger Modesto	FW	\N	\N
387	Buga	MF	\N	\N
388	Dudu Miraíma	MF	\N	\N
389	Igor Dutra	DF	\N	\N
390	Matheus Mega	DF	\N	\N
391	Alan Pedro	MF	\N	\N
392	Luan Martins	MF	\N	\N
393	Yuri Reis	GK	\N	\N
394	Jefferson Júnior	FW	\N	\N
395	Juninho Valoura	MF	\N	\N
396	Rômulo	FW	\N	\N
397	Mateus Buiate	DF	\N	\N
398	Roberto	DF	\N	\N
399	Gustavo Cabral	MF	\N	\N
400	Iury Tanque	FW	\N	\N
401	Foguinho	MF	\N	\N
402	Fernando Castro	GK	\N	\N
403	Miqueias	FW	\N	\N
404	Eduardo Biazus	DF	\N	\N
405	Gustavo Xuxa	MF	\N	\N
406	Wellington Carvalho	DF	\N	\N
407	Raphinha	DF	\N	\N
408	Vidal	DF	\N	\N
409	Marcos Vinicius	FW	\N	\N
410	Davi Agra	DF	\N	\N
411	Vander	MF	\N	\N
412	Marcelinho	FW	\N	\N
413	Baianinho	FW	\N	\N
414	Enzo Santos	DF	\N	\N
415	Cauã Soares	DF	\N	\N
416	Igor Bahia	FW	\N	\N
417	Guilherme Santana	MF	\N	\N
418	Felipe Albuquerque	DF	\N	\N
419	Angelo	FW	\N	\N
420	Adiel	FW	\N	\N
421	Danilinho	MF	\N	\N
422	Gabriel Felix	GK	\N	\N
423	Guilherme Cachoeira	FW	\N	\N
424	Luiz Gustavo	DF	\N	\N
425	Marllon Moizes	DF	\N	\N
426	Betinho	MF	\N	\N
427	Teles Junior	FW	\N	\N
428	Wellington Júnior	FW	\N	\N
429	Rodrigo Amorim	DF	\N	\N
430	Islan	DF	\N	\N
431	Matías Cavalleri	FW	\N	\N
432	Camacho	MF	\N	\N
433	Gustavo	DF	\N	\N
434	Georgemy	GK	\N	\N
435	Ramon Batista	MF	\N	\N
436	Francisco Serrate	DF	\N	\N
437	Klenisson	FW	\N	\N
438	Ewerton	FW	\N	\N
439	Betão	DF	\N	\N
440	Luiz Guilherme	MF	\N	\N
441	Wanderson	DF	\N	\N
442	Léo Costa	MF	\N	\N
443	Sobral	MF	\N	\N
444	Marcão	DF	\N	\N
445	Lucas Matheus	GK	\N	\N
446	Batinga	MF	\N	\N
447	Ciel	FW	\N	\N
448	Gabriel Vieira	MF	\N	\N
449	Luciano Naninho	MF	\N	\N
450	Diogo Batista	DF	\N	\N
451	Arthur Rocha	MF	\N	\N
452	Matheus Sacramento	FW	\N	\N
453	Kayllan	MF	\N	\N
454	Matheus Souza	FW	\N	\N
455	Kaike	DF	\N	\N
456	Igor Guilherme	MF	\N	\N
457	Félix Jorge	DF	\N	\N
458	Samuel Reis	FW	\N	\N
459	Calyl	DF	\N	\N
460	Rian Santana	FW	\N	\N
461	Renato Pitbull	MF	\N	\N
462	Ailton Santos	DF	\N	\N
463	Fabrício Bigode	MF	\N	\N
464	Dudu Figueiredo	MF	\N	\N
465	Petrucio	MF	\N	\N
466	Marcos Ytalo	DF	\N	\N
467	Amorim	DF	\N	\N
468	Ronaldo Mendes	MF	\N	\N
469	Lucas Serafini	DF	\N	\N
470	Caio Hila	DF	\N	\N
471	Wellerson	GK	\N	\N
472	Gabriel Boquinha	DF	\N	\N
473	Marlon Lopes	DF	\N	\N
474	Vitinho	FW	\N	\N
475	Mikael	DF	\N	\N
476	Lucas Lima	FW	\N	\N
477	Yago Oliveira	GK	\N	\N
478	Luquinhas	FW	\N	\N
479	Thiago Medeiros	MF	\N	\N
480	Buba	FW	\N	\N
481	Felipe Rodrigues	MF	\N	\N
482	Arthur Silveira	GK	\N	\N
483	Matheus Melo	MF	\N	\N
484	Rayan	DF	\N	\N
37	Diego Renan	DF	Brasileiro	\N
7	João Paulo	FW	Brasileiro	\N
1	Rodrigo Pimpão	FW	Brasileiro	\N
5	Didira	MF	Brasileiro	\N
9	Lucão	DF	Brasileiro	\N
12	Élton	FW	Brasileiro	\N
15	Dellatorre	FW	Brasileiro	\N
17	Alan Costa	DF	Brasileiro	\N
18	Apodi	DF	Brasileiro	\N
21	Nilton	MF	Brasileiro	\N
23	Rafinha	DF	Brasileiro	\N
24	João Vitor	MF	Brasileiro	\N
30	Cristovam	DF	Brasileiro	\N
32	Gabriel	MF	Brasileiro	\N
40	Cedric	DF	Camaronês	\N
45	Renato Cajá	MF	Brasileiro	\N
47	Geovane	MF	Brasileiro	\N
485	Flávio	GK	Brazilian	\N
486	Lucão	DF	Brazilian	\N
487	Catanha	FW	Brazilian	\N
488	Cristiano Alagoano	FW	Brazilian	\N
489	Alexsandro	FW	Brazilian	\N
490	Jorge Siri	FW	Brazilian	\N
491	Paulinho Macaíba	FW	Brazilian	\N
492	Robinho	FW	Brazilian	\N
493	Robinho	FW	Brazilian	\N
494	Ênio Oliveira	Meia	Brasileiro	\N
495	Rommel	Meia	Brasileiro	\N
496	Dentinho	Atacante	Brasileiro	\N
497	Gilmar	Atacante	Brasileiro	\N
498	Peu	Atacante	Brasileiro	\N
500	Hélio Sururu	Atacante	Brasileiro	\N
501	Zé Carlos Baiano	Atacante	Brasileiro	\N
499	Almir Explosão	Atacante	Brasileiro	\N
\.


--
-- Data for Name: season_top_scorers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.season_top_scorers (id, season, player_name, goals, verified) FROM stdin;
1	2025	Tiago Marques	17	t
2	2024	Tiago Marques	18	t
3	2023	Tomas Bastos	8	t
4	2022	Rodrigo Rodrigues	20	t
5	2021	Dellatorre	24	t
6	2020	Rodrigo Pimpão	10	t
7	2020	Paulo Sérgio	10	t
8	2019	Patrick Fabiano	9	t
9	2018	Didira	13	t
10	2017	Everton Heleno	14	t
12	2026	Rian Santana	15	t
11	2016	Cleyton Lima	11	t
\.


--
-- Data for Name: stadiums; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stadiums (id, name, city, capacity) FROM stdin;
1	Estádio Rei Pelé	Maceió	19000
2	Estádio Mundialão	Maceió	5000
3	Estádio do CRB	Maceió	8000
4	Estádio Castelão	Fortaleza	63903
5	Estádio Ilha do Retiro	Recife	35000
6	Estádio Aflitos	Recife	20000
7	Estádio do Arruda	Recife	60000
8	Arena Fonte Nova	Salvador	48000
9	Estádio de Pituaçu	Salvador	35000
10	Estádio Presidente Vargas	Fortaleza	20000
\.


--
-- Name: competitions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.competitions_id_seq', 15, true);


--
-- Name: league_positions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.league_positions_id_seq', 20, true);


--
-- Name: managers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.managers_id_seq', 80, true);


--
-- Name: matches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.matches_id_seq', 1827, true);


--
-- Name: opponents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.opponents_id_seq', 159, true);


--
-- Name: player_season_stats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.player_season_stats_id_seq', 754, true);


--
-- Name: players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.players_id_seq', 501, true);


--
-- Name: season_top_scorers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.season_top_scorers_id_seq', 12, true);


--
-- Name: stadiums_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.stadiums_id_seq', 10, true);


--
-- Name: competitions competitions_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitions
    ADD CONSTRAINT competitions_name_unique UNIQUE (name);


--
-- Name: competitions competitions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.competitions
    ADD CONSTRAINT competitions_pkey PRIMARY KEY (id);


--
-- Name: league_positions league_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.league_positions
    ADD CONSTRAINT league_positions_pkey PRIMARY KEY (id);


--
-- Name: managers managers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.managers
    ADD CONSTRAINT managers_pkey PRIMARY KEY (id);


--
-- Name: matches matches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_pkey PRIMARY KEY (id);


--
-- Name: opponents opponents_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opponents
    ADD CONSTRAINT opponents_name_unique UNIQUE (name);


--
-- Name: opponents opponents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.opponents
    ADD CONSTRAINT opponents_pkey PRIMARY KEY (id);


--
-- Name: player_season_stats player_season_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_season_stats
    ADD CONSTRAINT player_season_stats_pkey PRIMARY KEY (id);


--
-- Name: players players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.players
    ADD CONSTRAINT players_pkey PRIMARY KEY (id);


--
-- Name: season_top_scorers season_top_scorers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.season_top_scorers
    ADD CONSTRAINT season_top_scorers_pkey PRIMARY KEY (id);


--
-- Name: stadiums stadiums_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stadiums
    ADD CONSTRAINT stadiums_pkey PRIMARY KEY (id);


--
-- Name: matches matches_competition_id_competitions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_competition_id_competitions_id_fk FOREIGN KEY (competition_id) REFERENCES public.competitions(id);


--
-- Name: matches matches_manager_id_managers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_manager_id_managers_id_fk FOREIGN KEY (manager_id) REFERENCES public.managers(id);


--
-- Name: matches matches_opponent_id_opponents_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_opponent_id_opponents_id_fk FOREIGN KEY (opponent_id) REFERENCES public.opponents(id);


--
-- Name: matches matches_stadium_id_stadiums_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matches
    ADD CONSTRAINT matches_stadium_id_stadiums_id_fk FOREIGN KEY (stadium_id) REFERENCES public.stadiums(id);


--
-- Name: player_season_stats player_season_stats_player_id_players_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_season_stats
    ADD CONSTRAINT player_season_stats_player_id_players_id_fk FOREIGN KEY (player_id) REFERENCES public.players(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FAvHvFRxLAT4HnezsK3vKh46kcZo6fhWQZqbXv8gOjz5EHI7LP9IXpICE1c97Ps

