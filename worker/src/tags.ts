export interface ParsedTags {
  remember: string[];
  vocabKnown: string[];
  vocabStruggle: string[];
}

const REMEMBER_RE = /\[REMEMBER:\s*([^\]]+)\]/g;
const VOCAB_KNOWN_RE = /\[VOCAB_KNOWN:\s*([^\]]+)\]/g;
const VOCAB_STRUGGLE_RE = /\[VOCAB_STRUGGLE:\s*([^\]]+)\]/g;

function extractAll(text: string, re: RegExp): string[] {
  const results: string[] = [];
  for (const match of text.matchAll(re)) {
    results.push(match[1].trim());
  }
  return results;
}

export function parseTags(text: string): ParsedTags {
  return {
    remember: extractAll(text, REMEMBER_RE),
    vocabKnown: extractAll(text, VOCAB_KNOWN_RE),
    vocabStruggle: extractAll(text, VOCAB_STRUGGLE_RE),
  };
}

export function stripTags(text: string): string {
  return text
    .replace(REMEMBER_RE, "")
    .replace(VOCAB_KNOWN_RE, "")
    .replace(VOCAB_STRUGGLE_RE, "");
}
