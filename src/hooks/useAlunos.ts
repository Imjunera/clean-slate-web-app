import { useCallback, useEffect, useState } from "react";
import { alunosService } from "@/services/alunos.service";
import { qrService } from "@/services/qr.service";
import { notify, uiError } from "@/lib/notify";
import type { Aluno, AlunoInput } from "@/domain/types";

export function useAlunos() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setAlunos(await alunosService.list());
    } catch (e) {
      notify.erro("Erro ao carregar", uiError(e));
      setAlunos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const create = useCallback(async (input: AlunoInput) => {
    setSaving(true);
    try {
      const created = await alunosService.create(input);
      const qr = await qrService.generateForAluno(created.id);
      await alunosService.setQr(created.id, qr);
      notify.sucesso("Aluno cadastrado", input.nome);
      await reload();
    } catch (e) {
      notify.erro("Erro ao salvar", uiError(e));
      throw e;
    } finally {
      setSaving(false);
    }
  }, [reload]);

  const update = useCallback(async (id: string, input: AlunoInput) => {
    setSaving(true);
    try {
      await alunosService.update(id, input);
      const qr = await qrService.generateForAluno(id);
      await alunosService.setQr(id, qr);
      notify.sucesso("Aluno atualizado", input.nome);
      await reload();
    } catch (e) {
      notify.erro("Erro ao atualizar", uiError(e));
      throw e;
    } finally {
      setSaving(false);
    }
  }, [reload]);

  const remove = useCallback(async (id: string) => {
    try {
      await alunosService.remove(id);
      notify.sucesso("Aluno excluído");
      await reload();
    } catch (e) {
      notify.erro("Erro ao excluir", uiError(e));
    }
  }, [reload]);

  const removeAll = useCallback(async () => {
    try {
      await alunosService.removeAll();
      notify.sucesso("Todos os alunos foram apagados");
      await reload();
    } catch (e) {
      notify.erro("Erro ao apagar", uiError(e));
    }
  }, [reload]);

  return { alunos, loading, saving, reload, create, update, remove, removeAll };
}
