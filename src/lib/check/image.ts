// "Save as image": the summary card drawn on a canvas, ported from Check.dc.html
// (saveImage). Made in the browser and never uploaded. The image is always light (V2).
// Health information: the object URL is revoked straight after the download starts, and the
// PNG is kept in no cache or storage. The neutral file name is an open item (PLAN §7.3).

export const IMAGE_NAME = 'tbph-summary.png';

// Fixed light colours: the saved image doesn't follow dark mode (V2).
const INK = '#14212B';
const MUTED = '#56626A';
const PAPER = '#F2F0EA';
const RULE = '#D9D5CB';

export interface CardImage {
  title: string;
  rows: readonly { label: string; value: string }[];
  foot: string;
  privacy: string;
  /** The page's own font stacks (Astro names the self-hosted faces). */
  bodyFont: string;
  markFont: string;
}

export function drawCard(card: CardImage): Promise<Blob | null> {
  const W = 1080;
  const P = 76;
  const inner = W - P * 2;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.resolve(null);
  const font = (weight: number, size: number) => `${weight} ${size}px ${card.bodyFont}`;
  const wrap = (text: string, f: string) => {
    ctx.font = f;
    const lines: string[] = [];
    let line = '';
    for (const word of String(text).split(' ')) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > inner && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
    return lines;
  };
  const title = wrap(card.title, font(700, 40));
  const items = card.rows.map((r) => ({ k: wrap(r.label, font(700, 26)), v: wrap(r.value, font(400, 32)) }));
  const foot = wrap(card.foot, font(400, 24));
  const privacy = wrap(card.privacy, font(400, 24));
  let h = P + 40 + title.length * 50 + 24 + 4;
  for (const it of items) h += 22 + it.k.length * 34 + 6 + it.v.length * 42 + 22 + 2;
  h += 26 + foot.length * 32 + 10 + privacy.length * 32 + P;
  canvas.width = W;
  canvas.height = Math.ceil(h);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, canvas.height);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.strokeRect(28, 28, W - 56, canvas.height - 56);
  ctx.textBaseline = 'top';
  let y = P;
  ctx.fillStyle = INK;
  ctx.font = `600 28px ${card.markFont}`;
  ctx.fillText('TB PH', P, y);
  y += 40;
  ctx.font = font(700, 40);
  for (const l of title) {
    ctx.fillText(l, P, y);
    y += 50;
  }
  y += 24;
  ctx.fillRect(P, y, inner, 4);
  y += 4;
  for (const it of items) {
    y += 22;
    ctx.fillStyle = MUTED;
    ctx.font = font(700, 26);
    for (const l of it.k) {
      ctx.fillText(l, P, y);
      y += 34;
    }
    y += 6;
    ctx.fillStyle = INK;
    ctx.font = font(400, 32);
    for (const l of it.v) {
      ctx.fillText(l, P, y);
      y += 42;
    }
    y += 22;
    ctx.fillStyle = RULE;
    ctx.fillRect(P, y, inner, 2);
    y += 2;
  }
  y += 26;
  ctx.fillStyle = MUTED;
  ctx.font = font(400, 24);
  for (const l of foot) {
    ctx.fillText(l, P, y);
    y += 32;
  }
  y += 10;
  for (const l of privacy) {
    ctx.fillText(l, P, y);
    y += 32;
  }
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/**
 * Shares the PNG on touch devices that can, else downloads it. Resolves to whether it was
 * saved (false if the visitor cancelled the share sheet).
 */
export async function saveImage(blob: Blob, title: string): Promise<boolean> {
  try {
    const file = new File([blob], IMAGE_NAME, { type: 'image/png' });
    const coarse = matchMedia('(pointer: coarse)').matches;
    if (coarse && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title });
      return true;
    }
  } catch (error) {
    if ((error as Error | null)?.name === 'AbortError') return false;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = IMAGE_NAME;
  document.body.append(link);
  link.click();
  link.remove();
  // Revoked as soon as the click has handed the download to the browser.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}
