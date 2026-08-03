/** Gera card 1080×1080 do Quem é o Jogador? com foto borrada (sem revelar o nome). */

const SIZE = 1080;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar foto para o card"));
    img.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export async function buildGuessShareCard(opts: {
  playerId: number;
  won: boolean;
  attempts: number;
  gameNumber: number;
}): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");

  // Fundo azul CSA
  const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  grad.addColorStop(0, "#0f2748");
  grad.addColorStop(0.55, "#1B3A6B");
  grad.addColorStop(1, "#0a1a30");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Foto borrada (proxy same-origin)
  const photoSrc = `/api/quem-e-o-jogador/photo/${opts.playerId}`;
  try {
    const img = await loadImage(photoSrc);
    ctx.save();
    // Desenha ampliado + blur forte para não reconhecer o rosto
    ctx.filter = "blur(48px) brightness(0.85)";
    const scale = Math.max(SIZE / img.width, SIZE / img.height) * 1.35;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2 - 40, w, h);
    ctx.restore();
  } catch {
    // Sem foto: mantém só o fundo
  }

  // Vinheta
  const vig = ctx.createRadialGradient(
    SIZE / 2,
    SIZE / 2,
    SIZE * 0.2,
    SIZE / 2,
    SIZE / 2,
    SIZE * 0.72,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Faixa inferior
  ctx.fillStyle = "rgba(10, 26, 48, 0.82)";
  roundRect(ctx, 48, SIZE - 340, SIZE - 96, 260, 28);
  ctx.fill();

  ctx.fillStyle = "#F5C518";
  ctx.font = "600 36px system-ui, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("QUEM É O JOGADOR?", SIZE / 2, SIZE - 280);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 52px system-ui, Segoe UI, sans-serif";
  const headline = opts.won
    ? `Acertei em ${opts.attempts} tentativa${opts.attempts === 1 ? "" : "s"}!`
    : "Não descobri o jogador de hoje";
  ctx.fillText(headline, SIZE / 2, SIZE - 210);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "500 34px system-ui, Segoe UI, sans-serif";
  ctx.fillText(`Portal Marujo · #${opts.gameNumber}`, SIZE / 2, SIZE - 145);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "400 26px system-ui, Segoe UI, sans-serif";
  ctx.fillText("portalmarujo — /quem-e-o-jogador", SIZE / 2, SIZE - 95);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Falha ao gerar imagem"));
        else resolve(blob);
      },
      "image/png",
      0.95,
    );
  });
}

export function canShareFiles(): boolean {
  try {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({
        files: [new File(["x"], "t.png", { type: "image/png" })],
      })
    );
  } catch {
    return false;
  }
}
