import { toast } from "sonner";

export const notify = {
  sucesso: (titulo: string, descricao?: string) => toast.success(titulo, { description: descricao }),
  erro: (titulo: string, descricao?: string) => toast.error(titulo, { description: descricao }),
  aviso: (titulo: string, descricao?: string) => toast.warning(titulo, { description: descricao }),
  info: (titulo: string, descricao?: string) => toast.info(titulo, { description: descricao }),
};
