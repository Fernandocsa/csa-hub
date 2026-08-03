import { Link } from "wouter";
import type { ReactNode } from "react";
import { useGetTitles } from "@workspace/api-client-react";
import { CsaCrest } from "@/components/OpponentCrest";
import { formatInt } from "@/lib/utils";

const SECTIONS = [
  { id: "fundacao", label: "Fundação" },
  { id: "nome", label: "Nome" },
  { id: "mutange", label: "Mutange" },
  { id: "rivalidade", label: "Rivalidade" },
  { id: "hino", label: "Hino" },
  { id: "cores", label: "Apelido e cores" },
  { id: "marcos", label: "Marcos" },
  { id: "escudo", label: "Escudo" },
  { id: "estadio", label: "Estádio Rei Pelé" },
  { id: "fontes", label: "Fontes" },
] as const;

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-lg font-semibold border-l-4 border-primary pl-3">
      {children}
    </h2>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
  );
}

/** Institutional history of Centro Sportivo Alagoano. */
export default function AboutCsa() {
  const { data: titles } = useGetTitles();

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="border-b pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Clube
        </p>
        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          data-testid="heading-sobre"
        >
          Sobre o CSA
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Identidade e história do Centro Sportivo Alagoano — o Azulão do
          Mutange.
        </p>
      </div>

      <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm border-b pb-3">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {s.label}
          </a>
        ))}
      </nav>

      {/* ——— Fundação ——— */}
      <section id="fundacao" className="scroll-mt-20 space-y-3">
        <SectionTitle>Fundação</SectionTitle>
        <P>
          O CSA nasceu em <strong className="text-foreground">7 de setembro de 1913</strong>,
          quando um grupo de desportistas liderado por{" "}
          <strong className="text-foreground">Jonas de Oliveira</strong> se reuniu no
          salão nobre da Sociedade Perseverança e Auxílio dos Empregados no
          Comércio de Maceió — que na época funcionava no palacete do Barão de
          Jaraguá, na Praça D. Pedro II — para fundar o clube. A assembleia
          aconteceu logo depois de uma sessão solene comemorando o aniversário
          da Independência do Brasil, o que explica a coincidência da data de
          fundação.
        </P>
        <P>
          O clube recebeu inicialmente o nome de{" "}
          <strong className="text-foreground">Centro Sportivo Sete de Setembro</strong>,
          em homenagem à própria data de criação. Curiosamente, o futebol não
          foi o primeiro esporte praticado: os primeiros atletas do clube eram
          lutadores de boxe e luta greco-romana, além de levantadores de peso,
          arremessadores de dardo e disco, e esgrimistas. Os esportes náuticos
          só entraram na história do clube em 1917, com os associados usando a
          Lagoa Mundaú para passeios e competições.
        </P>
        <P>
          Segundo o livro de Renato Sampaio, a Ata de Fundação foi assinada por
          (entre outros) Antenor Barbosa Reis, Avenor Dantas, Agerson Dantas,
          Pedro Soares Machado, Nestor Machado, Waldomiro Machado, Djalma
          Machado, Pedro Lobão, Alfeu Cavalcanti, João Rosas, João Alfredo do
          Rego Monteiro, Jeferson Araújo, Arlindo Costa, Antônio Valente,
          Eduardo Goulart, Francisco Rocha Filho, Arthur Tavares da Costa, José
          Farias, Luiz Farias, Davino Ataíde, José Fontan, Odilon Cabral, Pedro
          A. Rocha e Rubens Fídias. Outras fontes documentam também Jonas de
          Oliveira, Osório Gatto, Eutíquio Gomes Filho, Francisco Rocha
          Cavalcante Filho, Arestides Ataíde de Oliveira, Antônio Miguel de
          Oliveira e Vicente Grossi.
        </P>
      </section>

      {/* ——— Nome ——— */}
      <section id="nome" className="scroll-mt-20 space-y-3">
        <SectionTitle>De Sete de Setembro a Centro Sportivo Alagoano</SectionTitle>
        <P>O nome do clube mudou duas vezes antes de chegar ao atual:</P>
        <ul className="text-sm leading-relaxed text-muted-foreground space-y-3 list-none pl-0">
          <li className="border-l-2 border-muted pl-3">
            <span className="font-medium text-foreground">1914</span> — passou a
            se chamar{" "}
            <strong className="text-foreground">
              Centro Sportivo José Floriano Peixoto
            </strong>{" "}
            (ou apenas &quot;Floriano Peixoto&quot;), homenageando o alagoano de
            destaque nacional José Floriano Peixoto. Em visita a Maceió, em junho
            de 1915, o homenageado ajudou o clube a conseguir a cessão de um
            prédio na Praça da Independência (que havia sido depósito de material
            bélico e sede de Tiros de Guerra) para servir de sede social, e
            ofereceu um troféu para uma partida entre duas equipes internas do
            clube.
          </li>
          <li className="border-l-2 border-muted pl-3">
            <span className="font-medium text-foreground">13 de abril de 1918</span>{" "}
            — em assembleia geral, o clube foi rebatizado pela última vez com o
            nome que mantém até hoje:{" "}
            <strong className="text-foreground">Centro Sportivo Alagoano</strong>.
          </li>
        </ul>
        <P>
          A primeira partida de futebol do clube aconteceu em 7 de setembro de
          1914, contra um time de estudantes alagoanos que estudavam em Recife
          (apelidados de &quot;noivinhos&quot; por jogarem de branco) — vitória
          por 3 a 0.
        </P>
      </section>

      {/* ——— Mutange ——— */}
      <section id="mutange" className="scroll-mt-20 space-y-3">
        <SectionTitle>O primeiro campo e a chegada ao Mutange</SectionTitle>
        <P>
          O primeiro campo de futebol da capital ficava perto do atual Parque
          Gonçalves Ledo, no Alto do Jacutinga — palco dos primeiros jogos de
          futebol em Maceió, ainda em 1908. A partir de 1916, o campo mais usado
          pelos clubes recém-formados ficava na Praça Jonas Montenegro (hoje
          Praça do Centenário, no Farol) — foi ali, em 7 de setembro de 1916,
          que o clube inaugurou seu primeiro campo próprio, com uma partida
          festiva contra o CRB (vitória por 1 a 0, gol de Aristides, &quot;o
          Grilo&quot;).
        </P>
        <P>
          No fim da década de 1910, a sede do CSA passou para o{" "}
          <strong className="text-foreground">Mutange</strong>, na chácara de
          Alfred Wucherer (curiosidade: ele nasceu a bordo de um navio inglês e
          foi naturalizado inglês pelo comandante da embarcação, mesmo sendo
          filho de alemães). A partir de 15 de novembro de 1922, o clube deixou
          de vez o campo na Praça Jonas Montenegro para jogar no Mutange, então
          de propriedade de Aristheu Teixeira Basto — que também foi presidente
          do clube.
        </P>

        <h3 className="text-sm font-semibold text-foreground pt-1">
          A negociação que salvou o campo do Mutange (1934)
        </h3>
        <P>
          Em 1934, Aristheu Teixeira Basto pediu a devolução do terreno que o CSA
          ocupava sem pagar aluguel desde 1922. O então presidente, Murilo Silva,
          convidou <strong className="text-foreground">Paulo Pedrosa</strong> —
          cunhado do proprietário — para assumir a diretoria do clube e negociar
          a permanência. Pedrosa encontrou um clube com apenas 28 sócios,
          sustentado em parte pelos próprios jogadores (ainda amadores). Ele
          lançou uma campanha de associação que rapidamente reuniu 150 sócios
          pagantes e, com o apoio de{" "}
          <strong className="text-foreground">Gustavo Paiva</strong> (também
          cunhado de Aristheu), negociou a compra parcelada do terreno.
        </P>
        <P>
          O estádio, inaugurado em 15 de novembro de 1922, recebeu o nome
          oficial de{" "}
          <strong className="text-foreground">Estádio Gustavo Paiva</strong> em
          29 de agosto de 1951, em homenagem a esse sócio (falecido em
          27/10/1943) — mas segue popularmente conhecido como{" "}
          <strong className="text-foreground">Estádio do Mutange</strong>, o
          bairro onde fica. Por muitos anos foi o estádio mais moderno de
          Alagoas e o único com refletores para jogos noturnos. Em 1951, recebeu
          o primeiro jogo internacional realizado em Alagoas: CSA 1 a 1 Vélez
          Sarsfield (Argentina).
        </P>
        <Link
          href="/estadios/29"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Ver página do Estádio do Mutange →
        </Link>
      </section>

      {/* ——— Rivalidade ——— */}
      <section id="rivalidade" className="scroll-mt-20 space-y-3">
        <SectionTitle>A rivalidade com o CRB</SectionTitle>
        <P>
          O primeiro confronto entre os dois clubes aconteceu já em 7 de
          setembro de 1916 (vitória do CSA por 1 a 0), mas a primeira partida{" "}
          <strong className="text-foreground">oficial</strong> só ocorreu em 4 de
          setembro de 1927, pelo campeonato da Coligação Esportiva de Alagoas —
          dessa vez o CRB venceu por 2 a 0, no Mutange.
        </P>
        <P>
          O episódio mais dramático da rivalidade aconteceu nos anos 1930: um
          jogo amistoso proposto pelo CSA gerou um desentendimento (o CRB queria
          incluir jogadores emprestados de outros clubes) que virou uma guerra
          de declarações na imprensa entre os presidentes dos dois clubes,{" "}
          <strong className="text-foreground">Osório Gatto</strong> (CSA) e{" "}
          <strong className="text-foreground">Ismael Acioli</strong> (CRB). A
          disputa escalou a ponto de um confronto pessoal na Rua do Comércio, em
          Maceió: Osório Gatto atirou contra Ismael Acioli, ferindo-o na coxa.
          Anos depois, os dois se reconciliaram pessoalmente num encontro
          fortuito — mas a rivalidade entre os clubes segue viva até hoje.
        </P>
        <P>
          Uma curiosidade que quebra esse clima: em 1931, durante um amistoso do
          CSA contra o América de Recife, o líder informal do time azulino,{" "}
          <strong className="text-foreground">Tininho</strong>, insistiu em
          escalar dois jogadores emprestados justamente do CRB (Zequito Porto e
          Fonseca) — desafiando a própria diretoria, que temia a reação da
          torcida. Tininho assumiu a responsabilidade e a dupla ajudou o CSA a
          vencer por 4 a 2, com Fonseca marcando dois gols.
        </P>
        <Link
          href="/classico"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Ver o Clássico das Multidões no Portal →
        </Link>
      </section>

      {/* ——— Hino ——— */}
      <section id="hino" className="scroll-mt-20 space-y-3">
        <SectionTitle>Hino</SectionTitle>
        <P>
          O hino do CSA tem letra de{" "}
          <strong className="text-foreground">Cipriano Jucá</strong> e música
          composta em 1923 pelo maestro italiano{" "}
          <strong className="text-foreground">Reunivestein Donizetti</strong> (o
          mesmo que fez o arranjo do hino do Ypiranga Futebol Clube em 1921).
          Foi oficialmente registrado no jornal &quot;O Azulino&quot;, edição
          comemorativa dos 40 anos do clube, lançada em 7 de setembro de 1953,
          sob a presidência de Carlos Ramiro Basto.
        </P>
        <P>
          Em 1997, sob a presidência de Euclides Mello, a letra foi modificada
          para atualizar expressões consideradas arcaicas. Existe ainda uma
          canção separada, composta nos anos 1960 por Sabino Romariz, que se
          tornou muito popular entre a torcida — a ponto de alguns torcedores
          confundirem essa canção com o hino oficial.
        </P>
        <div className="rounded border border-dashed px-4 py-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Letra
          </p>
          <p className="text-sm text-muted-foreground">
            A letra completa — original e a versão modificada de 1997 — será
            publicada aqui quando autorizada (direitos autorais). Enquanto isso,
            a contextualização histórica acima permanece disponível.
          </p>
        </div>
      </section>

      {/* ——— Cores / apelido ——— */}
      <section id="cores" className="scroll-mt-20 space-y-3">
        <SectionTitle>Apelido e cores</SectionTitle>
        <div className="flex gap-3 items-center">
          <span
            className="w-10 h-10 rounded-full border shadow-sm"
            style={{ background: "#1B3A6B" }}
            title="Azul CSA"
          />
          <span
            className="w-10 h-10 rounded-full border shadow-sm bg-white"
            title="Branco"
          />
          <span className="text-sm text-muted-foreground">
            Alvi-celeste — branco e azul-celeste, como na letra do hino.
          </span>
        </div>
        <ul className="text-sm space-y-1.5 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Azulão do Mutange</span>{" "}
            — apelido mais usado, em referência ao bairro do estádio histórico
          </li>
          <li>
            <span className="font-medium text-foreground">Azulão</span> — forma
            curta popular na torcida
          </li>
          <li>
            <span className="font-medium text-foreground">
              Centro Sportivo Alagoano
            </span>{" "}
            — nome por extenso ·{" "}
            <span className="font-medium text-foreground">CSA</span> — sigla
            oficial
          </li>
        </ul>
      </section>

      {/* ——— Marcos ——— */}
      <section id="marcos" className="scroll-mt-20 space-y-3">
        <SectionTitle>Títulos e marcos recentes</SectionTitle>
        <P>
          Alguns marcos da trajetória moderna do clube (o total oficial de
          títulos no Portal vem do cadastro do site, não de matérias
          históricas):
        </P>
        <ul className="text-sm leading-relaxed text-muted-foreground space-y-2 list-disc pl-5">
          <li>
            Vice-campeão da Taça de Prata em 1980, 1982 e 1983
          </li>
          <li>Vice-campeão da Copa Conmebol em 1999</li>
          <li>
            <strong className="text-foreground">2016</strong>: vice-campeão da
            Série D
          </li>
          <li>
            <strong className="text-foreground">2017</strong>: primeiro título
            nacional da história — Campeonato Brasileiro Série C
          </li>
          <li>
            <strong className="text-foreground">2018</strong>: vice-campeão da
            Série B, com acesso histórico à Série A
          </li>
        </ul>
        {titles && titles.total > 0 && (
          <Link
            href="/titulos"
            className="block border rounded p-4 hover:bg-muted/40 transition-colors"
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              No Portal Marujo
            </p>
            <p className="text-2xl font-black text-primary mt-0.5">
              {formatInt(titles.total)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {titles.total === 1 ? "título cadastrado" : "títulos cadastrados"}
              </span>
            </p>
            <p className="text-xs text-primary mt-1">Ver lista completa →</p>
          </Link>
        )}
      </section>

      {/* ——— Escudo ——— */}
      <section id="escudo" className="scroll-mt-20 space-y-3">
        <SectionTitle>Escudo</SectionTitle>
        <div className="flex items-start gap-4">
          <CsaCrest size="lg" className="!h-20 !w-20" />
          <P>
            Evolução do escudo ao longo dos anos — ainda sem fonte consolidada
            nesta página. Galeria histórica em preparação.
          </P>
        </div>
      </section>

      {/* ——— Rei Pelé ——— */}
      <section id="estadio" className="scroll-mt-20 space-y-3">
        <SectionTitle>Estádio Rei Pelé</SectionTitle>
        <P>
          Casa atual do CSA em Maceió — o Trapichão. História, capacidade e
          fichas de jogos no perfil do estádio. O Mutange permanece o estádio
          histórico do Azulão.
        </P>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href="/estadios/1"
            className="inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ver Estádio Rei Pelé →
          </Link>
          <Link
            href="/estadios/29"
            className="inline-flex text-sm font-medium text-primary hover:underline"
          >
            Ver Estádio do Mutange →
          </Link>
        </div>
      </section>

      {/* ——— Fontes ——— */}
      <section id="fontes" className="scroll-mt-20 space-y-3 border-t pt-6">
        <SectionTitle>Fontes e lacunas</SectionTitle>
        <P>
          Texto organizado a partir da matéria &quot;CSA, o azulão do
          Mutange&quot; (historiadealagoas.com.br, por Edberto Ticianeli),
          reescrito para o Portal. Fontes citadas na matéria original incluem
          Wikipédia, o livro{" "}
          <em className="text-foreground/80">Rio Largo cidade operária</em>{" "}
          (Arnaldo Paiva Filho), o jornal Diário do Povo (1916/1917) e o livro{" "}
          <em className="text-foreground/80">À Margem do Futebol</em> (Renato
          Sampaio).
        </P>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>
            Letra do hino (original e 1997): aguardando publicação autorizada
          </li>
          <li>História detalhada da evolução do escudo: ainda sem fonte</li>
          <li>
            Mascote oficial: não documentado na matéria-fonte — confirmação
            pendente
          </li>
          <li>
            Fotos históricas (Acervo Museu do Esporte e similares): checar
            direitos antes de publicar
          </li>
        </ul>
        <p className="text-xs text-muted-foreground pt-1">
          Também em{" "}
          <Link href="/presidentes" className="text-primary hover:underline">
            Presidentes
          </Link>{" "}
          e{" "}
          <Link href="/titulos" className="text-primary hover:underline">
            Títulos
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
