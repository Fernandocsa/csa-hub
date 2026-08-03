-- Editable site copy blocks (home intro, future page intros, etc.)
CREATE TABLE IF NOT EXISTS site_content (
  id serial PRIMARY KEY,
  key text NOT NULL,
  content text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS site_content_key_uidx ON site_content (key);

INSERT INTO site_content (key, content)
VALUES (
  'home_intro',
  E'# Portal Marujo — Base de dados do CSA\n\nUm projeto feito pra registrar, com precisão, mais de cem anos de história do CSA — cada partida, jogador, técnico, árbitro, adversário e presidente que já vestiu ou representou o Azulão.\n\nO selo ✓ aparece em qualquer registro do site — jogador, técnico, árbitro, adversário, presidente, o que for — e indica dados totalmente conferidos. O resto do acervo é confiável, mas cresce sempre que encontramos (ou recebemos) mais informação.\n\nVocê conhece um dado que falta, uma partida sem escalação, uma foto antiga? A torcida é parte desse trabalho. [Ajude a completar o acervo →](/sugestoes)'
)
ON CONFLICT (key) DO NOTHING;
