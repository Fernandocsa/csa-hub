/**
 * Set lineup.position for matches 1305 and 1309 so portal sorts by position (like #2241).
 */
import { loadEnvFromDotenv, createPgPool } from "./_load-env.mjs";

loadEnvFromDotenv(".env");
const pool = createPgPool();
const client = await pool.connect();

/** matchId -> playerId -> position */
const POS = {
  1305: {
    471: "Goleiro", // Wellerson
    466: "Lateral Direito", // Marcos Ytalo
    486: "Zagueiro", // Lucão
    484: "Zagueiro", // Rayan
    455: "Lateral Esquerdo", // Kaike
    453: "Volante", // Kayllan
    463: "Volante", // Fabrício Bigode
    464: "Meia Ofensivo", // Dudu
    480: "Centroavante", // Buba
    447: "Centroavante", // Ciel
    454: "Atacante", // Matheus Souza
    // bench
    482: "Goleiro", // Arthur
    469: "Lateral Direito", // Serafini
    457: "Zagueiro", // Félix
    435: "Volante", // Ramon
    461: "Volante", // Pitbull
    456: "Volante", // Igor
    483: "Meia", // Melo
    468: "Meia", // Mendes
    308: "Volante", // Wesley
    458: "Atacante", // Samuel Reis
    460: "Ponta Direita", // Rian
    493: "Ponta Esquerda", // Robinho
  },
  1309: {
    482: "Goleiro", // Arthur
    415: "Zagueiro", // Cauã
    457: "Zagueiro", // Félix
    435: "Zagueiro", // Ramon (camisa 4 nesta formação)
    461: "Volante", // Pitbull
    456: "Volante", // Igor
    483: "Meia", // Melo
    468: "Meia", // Mendes
    458: "Atacante", // Samuel Reis
    460: "Ponta Direita", // Rian
    493: "Ponta Esquerda", // Robinho
    // bench
    445: "Goleiro", // Lucas Matheus
    1667: "Goleiro", // Pedro Ariel
    469: "Lateral Direito", // Serafini
    459: "Zagueiro", // Calyl
    479: "Volante", // Thiago Medeiros
    440: "Meia Ofensivo", // Luiz Guilherme
    308: "Volante", // Wesley
    481: "Meia", // Felipe Rodrigues
    474: "Centroavante", // Vitinho
  },
};

/** Also set sort_order in canonical field order (like #2241). */
const ORDER = [
  "Goleiro",
  "Lateral Direito",
  "Lateral",
  "Zagueiro",
  "Lateral Esquerdo",
  "Volante",
  "Meia",
  "Meia Central",
  "Meia Ofensivo",
  "Meia Direita",
  "Meia Esquerda",
  "Ponta Direita",
  "Ponta Esquerda",
  "2º Atacante",
  "Centroavante",
  "Atacante",
];

try {
  await client.query("BEGIN");

  for (const [matchId, map] of Object.entries(POS)) {
    const id = Number(matchId);
    const { rows } = await client.query(
      `SELECT id, player_id, player_name, role FROM match_lineups
       WHERE match_id=$1 AND side='csa'`,
      [id],
    );

    // Assign positions
    for (const row of rows) {
      const pos = map[row.player_id];
      if (!pos) {
        console.warn(`#${id} missing position for ${row.player_name} (${row.player_id})`);
        continue;
      }
      await client.query(`UPDATE match_lineups SET position=$2 WHERE id=$1`, [
        row.id,
        pos,
      ]);
    }

    // Recompute sort_order: starters and bench each by position then shirt
    const { rows: updated } = await client.query(
      `SELECT id, role, position, shirt_number, player_name
       FROM match_lineups WHERE match_id=$1 AND side='csa'`,
      [id],
    );
    const rank = (r) => {
      const pi = ORDER.indexOf(r.position ?? "");
      return [
        r.role === "starter" ? 0 : 1,
        pi < 0 ? 99 : pi,
        r.shirt_number ?? 999,
        r.player_name ?? "",
      ];
    };
    updated.sort((a, b) => {
      const aa = rank(a);
      const bb = rank(b);
      for (let i = 0; i < aa.length; i++) {
        if (aa[i] < bb[i]) return -1;
        if (aa[i] > bb[i]) return 1;
      }
      return 0;
    });
    let sort = 0;
    for (const r of updated) {
      await client.query(`UPDATE match_lineups SET sort_order=$2 WHERE id=$1`, [
        r.id,
        sort++,
      ]);
    }

    console.log(`\n#${id} updated:`);
    for (const r of updated) {
      console.log(
        `  ${r.role} #${r.shirt_number} ${r.position} ${r.player_name}`,
      );
    }
  }

  await client.query("COMMIT");
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
