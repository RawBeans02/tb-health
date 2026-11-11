// Reads a stylesheet's custom properties: the :root rule outside any @media (the light values)
// and the :root rule inside its prefers-color-scheme: dark @media (the dark ones). Used for
// tokens.css and design/v8/theme.css (step 15.2, V7).
import { readFileSync } from 'node:fs';

export type Tokens = Record<string, string>;

function declarations(body: string): Tokens {
  return Object.fromEntries([...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

/** The one :root rule in `css`, or an error naming `where`. */
function root(css: string, where: string): Tokens {
  const rules = [...css.matchAll(/:root\s*\{([^}]*)\}/g)];
  if (rules.length !== 1) throw new Error(`${where}: ${rules.length} :root rules, expected 1`);
  return declarations(rules[0][1]);
}

export function readTokens(file: string): { light: Tokens; dark: Tokens; darkQuery: string } {
  const css = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  // Each top-level @media rule's query and body (braces counted), and what's left outside them.
  const media: { query: string; body: string }[] = [];
  let outside = '';
  let at = 0;
  for (const m of css.matchAll(/@media([^{]+)\{/g)) {
    if (m.index < at) continue; // inside the last one
    let depth = 1;
    let end = m.index + m[0].length;
    for (; end < css.length && depth; end++) depth += css[end] === '{' ? 1 : css[end] === '}' ? -1 : 0;
    outside += css.slice(at, m.index);
    media.push({ query: m[1].trim(), body: css.slice(m.index + m[0].length, end - 1) });
    at = end;
  }
  outside += css.slice(at);
  const darks = media.filter((m) => /prefers-color-scheme:\s*dark/.test(m.query));
  if (darks.length !== 1) throw new Error(`${file}: ${darks.length} prefers-color-scheme: dark rules, expected 1`);
  return { light: root(outside, `${file} (light)`), dark: root(darks[0].body, `${file} (dark)`), darkQuery: darks[0].query };
}
