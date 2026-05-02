import type { AlunoInput, TurnoNome } from "@/domain/types";
import { TURNO_NOMES } from "@/domain/turnos";

export interface ParsedRow {
  line: number;
  raw: string;
  ok: boolean;
  data?: AlunoInput;
  error?: string;
}

export interface ParseResult {
  valid: AlunoInput[];
  invalid: ParsedRow[];
  total: number;
}

const TURNO_SET = new Set<string>(TURNO_NOMES);

function normalizeTurno(value: string): TurnoNome | null {
  const v = value.trim().toLowerCase();
  if (v === "manha" || v === "manhã") return "Manhã";
  if (v === "tarde") return "Tarde";
  if (v === "noite") return "Noite";
  // Try original casing match
  const cap = value.trim();
  if (TURNO_SET.has(cap)) return cap as TurnoNome;
  return null;
}

const HEADER_RE = /^\s*nome\s*[;,\t|]\s*idade\s*[;,\t|]\s*turma\s*[;,\t|]\s*turno\s*$/i;

/**
 * Parses a TXT/CSV/MD file with the strict format:
 *   Nome;Idade;Turma;Turno
 * Accepts `;`, `,`, `\t`, or `|` as delimiters. Header row is optional.
 * Markdown table rows (leading `|`) and separator rows (`---`) are tolerated.
 */
export function parseAlunosFile(content: string): ParseResult {
  const valid: AlunoInput[] = [];
  const invalid: ParsedRow[] = [];

  const lines = content
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let total = 0;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Strip markdown table pipes around the row
    if (line.startsWith("|") && line.endsWith("|")) {
      line = line.slice(1, -1).trim();
    }

    // Skip markdown separator rows like |---|---|
    if (/^[-:\s|]+$/.test(line)) continue;

    // Skip header
    if (HEADER_RE.test(line)) continue;

    total++;

    // Detect delimiter (priority: ; then \t then | then ,)
    const delim = line.includes(";")
      ? ";"
      : line.includes("\t")
        ? "\t"
        : line.includes("|")
          ? "|"
          : ",";

    const parts = line.split(delim).map((p) => p.trim());

    if (parts.length < 4) {
      invalid.push({
        line: i + 1,
        raw: line,
        ok: false,
        error: `Esperado 4 colunas (Nome${delim}Idade${delim}Turma${delim}Turno), recebido ${parts.length}`,
      });
      continue;
    }

    const [nome, idadeStr, turma, turnoStr] = parts;

    if (!nome) {
      invalid.push({ line: i + 1, raw: line, ok: false, error: "Nome vazio" });
      continue;
    }

    const idade = Number(idadeStr.replace(",", "."));
    if (!Number.isFinite(idade) || idade < 1 || idade > 99 || !Number.isInteger(idade)) {
      invalid.push({ line: i + 1, raw: line, ok: false, error: `Idade inválida: "${idadeStr}"` });
      continue;
    }

    if (!turma) {
      invalid.push({ line: i + 1, raw: line, ok: false, error: "Turma vazia" });
      continue;
    }

    const turno = normalizeTurno(turnoStr);
    if (!turno) {
      invalid.push({
        line: i + 1,
        raw: line,
        ok: false,
        error: `Turno inválido: "${turnoStr}" (use Manhã, Tarde ou Noite)`,
      });
      continue;
    }

    valid.push({
      nome: nome.toUpperCase(),
      idade,
      turma,
      turno,
    });
  }

  return { valid, invalid, total };
}
