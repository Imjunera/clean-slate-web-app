import { toast } from "sonner";

/**
 * Sanitize unknown errors before showing them to end users.
 * Logs full detail to the console (for devs) and returns a generic message
 * so we never leak Supabase/PostgREST internals (table/column names, RLS
 * policy names, SQL fragments) into the UI.
 */
export function uiError(e: unknown, fallback = "Ocorreu um erro inesperado."): string {
  // eslint-disable-next-line no-console
  console.error(e);
  return fallback;
}

export const notify = {
  sucesso: (titulo: string, descricao?: string) => toast.success(titulo, { description: descricao }),
  erro: (titulo: string, descricao?: string) => toast.error(titulo, { description: descricao }),
  aviso: (titulo: string, descricao?: string) => toast.warning(titulo, { description: descricao }),
  info: (titulo: string, descricao?: string) => toast.info(titulo, { description: descricao }),
};
