import { Link } from "wouter";
import { CsaCrest } from "@/components/OpponentCrest";

const SECTIONS = [
  { id: "fundacao", label: "Fundação" },
  { id: "cores", label: "Cores e uniformes" },
  { id: "escudo", label: "Escudo" },
  { id: "estadio", label: "Estádio Rei Pelé" },
  { id: "apelidos", label: "Apelidos" },
  { id: "hino", label: "Hino" },
  { id: "mascote", label: "Mascote" },
] as const;

/** Institutional page — structure ready; fill copy/images as content arrives. */
export default function AboutCsa() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div className="border-b pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
          Clube
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="heading-sobre">
          Sobre o CSA
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Identidade, história e símbolos do Centro Sportivo Alagoano —
          o Azulão de Alagoas.
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

      <section id="fundacao" className="scroll-mt-20 space-y-3">
        <h2 className="text-lg font-semibold border-l-4 border-primary pl-3">Fundação</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Conteúdo em preparação. Em breve: data de fundação, fundadores e o
          contexto histórico da criação do Centro Sportivo Alagoano.
        </p>
      </section>

      <section id="cores" className="scroll-mt-20 space-y-3">
        <h2 className="text-lg font-semibold border-l-4 border-primary pl-3">
          Cores e uniformes
        </h2>
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
            Azul e branco — cores oficiais do Azulão.
          </span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Linha do tempo de uniformes históricos será adicionada quando o
          material fotográfico estiver disponível.
        </p>
      </section>

      <section id="escudo" className="scroll-mt-20 space-y-3">
        <h2 className="text-lg font-semibold border-l-4 border-primary pl-3">Escudo</h2>
        <div className="flex items-start gap-4">
          <CsaCrest size="lg" className="!h-20 !w-20" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            Evolução do escudo ao longo dos anos — galeria em construção.
          </p>
        </div>
      </section>

      <section id="estadio" className="scroll-mt-20 space-y-3">
        <h2 className="text-lg font-semibold border-l-4 border-primary pl-3">
          Estádio Rei Pelé
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Casa do CSA em Maceió — o Trapichão. História, capacidade e fichas
          de jogos no perfil do estádio.
        </p>
        <Link
          href="/estadios/1"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Ver página do Estádio Rei Pelé →
        </Link>
      </section>

      <section id="apelidos" className="scroll-mt-20 space-y-3">
        <h2 className="text-lg font-semibold border-l-4 border-primary pl-3">Apelidos</h2>
        <ul className="text-sm space-y-1.5 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Azulão</span> — apelido
            mais popular da torcida
          </li>
          <li>
            <span className="font-medium text-foreground">
              Centro Sportivo Alagoano
            </span>{" "}
            — nome por extenso
          </li>
          <li>
            <span className="font-medium text-foreground">CSA</span> — sigla
            oficial
          </li>
        </ul>
      </section>

      <section id="hino" className="scroll-mt-20 space-y-3">
        <h2 className="text-lg font-semibold border-l-4 border-primary pl-3">Hino</h2>
        <p className="text-sm leading-relaxed text-muted-foreground italic">
          Letra e áudio do hino serão publicados aqui.
        </p>
      </section>

      <section id="mascote" className="scroll-mt-20 space-y-3">
        <h2 className="text-lg font-semibold border-l-4 border-primary pl-3">Mascote</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Informações sobre o mascote do clube em preparação.
        </p>
      </section>
    </div>
  );
}
