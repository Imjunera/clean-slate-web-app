import { useRef, useState } from "react";
import { Upload, FileCheck2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parseAlunosFile, type ParseResult } from "@/lib/importAlunos";
import { alunosService } from "@/services/alunos.service";
import { qrService } from "@/services/qr.service";
import { notify } from "@/lib/notify";

interface Props {
  onImported: () => void | Promise<void>;
}

const ACCEPT = ".txt,.csv,.md,text/plain,text/csv,text/markdown";

export function ImportAlunos({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [importing, setImporting] = useState(false);

  async function handleFile(file: File) {
    const ext = file.name.toLowerCase().split(".").pop();
    if (!ext || !["txt", "csv", "md"].includes(ext)) {
      notify.erro("Formato não suportado", "Use TXT, CSV ou MD.");
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseAlunosFile(text);
      setResult(parsed);
      setFilename(file.name);
      if (parsed.valid.length === 0) {
        notify.aviso("Nenhum registro válido", "Verifique o formato do arquivo.");
      } else {
        notify.info(
          `${parsed.valid.length} válido(s)`,
          parsed.invalid.length > 0 ? `${parsed.invalid.length} inválido(s)` : undefined,
        );
      }
    } catch (e) {
      notify.erro("Erro ao ler arquivo", (e as Error).message);
    }
  }

  async function confirmImport() {
    if (!result || result.valid.length === 0) return;
    setImporting(true);
    let okCount = 0;
    let failCount = 0;
    try {
      for (const input of result.valid) {
        try {
          const created = await alunosService.create(input);
          const qr = await qrService.generateForAluno(created.id);
          await alunosService.setQr(created.id, qr);
          okCount++;
        } catch {
          failCount++;
        }
      }
      if (okCount > 0) notify.sucesso(`${okCount} aluno(s) importado(s)`);
      if (failCount > 0) notify.erro(`${failCount} falha(s) ao salvar`);
      setResult(null);
      setFilename("");
      if (inputRef.current) inputRef.current.value = "";
      await onImported();
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setResult(null);
    setFilename("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" /> Importar alunos (TXT / CSV / MD)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Formato esperado por linha: <code className="rounded bg-muted px-1">Nome;Idade;Turma;Turno</code>.
          Turno deve ser <strong>Manhã</strong>, <strong>Tarde</strong> ou <strong>Noite</strong>.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Selecionar arquivo
          </Button>
          {filename && <span className="text-xs text-muted-foreground">{filename}</span>}
        </div>

        {result && (
          <div className="space-y-3 rounded-md border border-border bg-muted/40 p-3 animate-fade-in">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <FileCheck2 className="h-4 w-4 text-primary" />
                <strong>{result.valid.length}</strong> válido(s)
              </span>
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <strong>{result.invalid.length}</strong> rejeitado(s)
              </span>
              <span className="text-muted-foreground">de {result.total} linha(s)</span>
            </div>

            {result.invalid.length > 0 && (
              <div className="max-h-48 overflow-auto rounded border border-border bg-card p-2 text-xs">
                <ul className="space-y-1">
                  {result.invalid.slice(0, 50).map((row) => (
                    <li key={row.line} className="text-destructive">
                      <span className="font-mono">L{row.line}:</span> {row.error}
                      <div className="font-mono text-muted-foreground truncate">{row.raw}</div>
                    </li>
                  ))}
                  {result.invalid.length > 50 && (
                    <li className="text-muted-foreground">…e mais {result.invalid.length - 50}</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={confirmImport} disabled={importing || result.valid.length === 0}>
                {importing ? "Importando..." : `Importar ${result.valid.length} aluno(s)`}
              </Button>
              <Button variant="ghost" onClick={reset} disabled={importing}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
