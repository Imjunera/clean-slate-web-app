import { supabase } from "./supabase/client";
import type { Aluno, AlunoInput } from "@/domain/types";

const TABLE = "alunos";
const COLS = "id,nome,idade,turma,turno,qr";

export const alunosService = {
  async list(): Promise<Aluno[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .order("nome", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Aluno[];
  },

  async getById(id: string): Promise<Aluno | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select(COLS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return (data as Aluno | null) ?? null;
  },

  async create(input: AlunoInput): Promise<Aluno> {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([input])
      .select(COLS)
      .single();
    if (error) throw error;
    return data as Aluno;
  },

  async update(id: string, input: AlunoInput): Promise<void> {
    const { error } = await supabase.from(TABLE).update(input).eq("id", id);
    if (error) throw error;
  },

  async setQr(id: string, qr: string): Promise<void> {
    const { error } = await supabase.from(TABLE).update({ qr }).eq("id", id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  },

  async removeAll(): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
  },
};
