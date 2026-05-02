import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Aluno, Presenca } from "@/domain/types";

function header(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(subtitle, 14, 25);
    doc.setTextColor(0);
  }
}

export const pdfService = {
  alunos(alunos: Aluno[]): void {
    const doc = new jsPDF();
    header(doc, "Relatório de Alunos", `Total: ${alunos.length}`);
    autoTable(doc, {
      startY: 32,
      head: [["Nome", "Idade", "Turma", "Turno"]],
      body: alunos.map((a) => [a.nome, a.idade ?? "—", a.turma, a.turno]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 138, 76] },
    });
    doc.save(`alunos-${new Date().toISOString().slice(0, 10)}.pdf`);
  },

  presencasDoTurno(dia: string, turno: string, registros: Presenca[]): void {
    const doc = new jsPDF();
    header(doc, `Presenças — ${turno}`, `Data: ${dia} • Total: ${registros.length}`);
    autoTable(doc, {
      startY: 32,
      head: [["Nome", "Turma", "Status", "Horário"]],
      body: registros.map((r) => [
        r.nome,
        r.turma,
        r.status,
        new Date(r.horario_chegada).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [31, 138, 76] },
    });
    doc.save(`presencas-${dia}-${turno}.pdf`);
  },
};
