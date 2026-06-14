import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PgrRow {
  grupo_homogeneo: string;
  descricao_perigo: string;
  qtd_funcionarios: number;
  score_medio: number;
  grau_risco: number;
  classificacao_risco: string;
  medidas_controle: string;
}

const RISK_COLORS: Record<string, [number, number, number]> = {
  'Intolerável': [153, 27, 27],
  'Significativo': [239, 68, 68],
  'Moderado': [249, 115, 22],
  'Tolerável': [234, 179, 8],
  'Baixo': [34, 197, 94],
};

export function generatePGR(dados: PgrRow[], empresaNome: string | null) {
  if (!dados || dados.length === 0) {
    alert('Sem dados para gerar o relatório.');
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date().toLocaleDateString('pt-BR');

  // === HEADER ===
  doc.setFillColor(45, 90, 90);
  doc.rect(0, 0, pageWidth, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório PGR - M.A.P.A.', 14, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Programa de Gerenciamento de Riscos Psicossociais | COPSOQ II', 14, 22);
  doc.setFontSize(9);
  doc.text(`${empresaNome || 'Todas as Empresas'}  |  Gerado em ${now}`, 14, 28);

  // === RESUMO ===
  const setores = [...new Set(dados.map(d => d.grupo_homogeneo))];
  const totalColab = setores.reduce((acc, s) => {
    const row = dados.find(d => d.grupo_homogeneo === s);
    return acc + (row?.qtd_funcionarios || 0);
  }, 0);

  const riskCounts = {
    'Intolerável': dados.filter(d => d.classificacao_risco === 'Intolerável').length,
    'Significativo': dados.filter(d => d.classificacao_risco === 'Significativo').length,
    'Moderado': dados.filter(d => d.classificacao_risco === 'Moderado').length,
    'Tolerável': dados.filter(d => d.classificacao_risco === 'Tolerável').length,
    'Baixo': dados.filter(d => d.classificacao_risco === 'Baixo').length,
  };

  const summaryY = 40;
  const boxW = 42;
  const boxH = 22;
  const gap = 4;
  const startX = 14;

  const summaryItems = [
    { label: 'SETORES', value: String(setores.length), color: [59, 130, 246] },
    { label: 'COLABORADORES', value: String(totalColab), color: [99, 102, 241] },
    { label: 'INTOLERÁVEIS', value: String(riskCounts['Intolerável']), color: [220, 38, 38] },
    { label: 'SIGNIFICATIVOS', value: String(riskCounts['Significativo']), color: [239, 68, 68] },
  ];

  summaryItems.forEach((item, i) => {
    const x = startX + i * (boxW + gap);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, summaryY, boxW, boxH, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, summaryY, boxW, boxH, 2, 2, 'S');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(148, 163, 184);
    doc.text(item.label, x + 4, summaryY + 6);
    doc.setFontSize(16);
    const [r, g, b] = item.color;
    doc.setTextColor(r, g, b);
    doc.text(item.value, x + 4, summaryY + 17);
  });

  // === RESUMO POR SETOR ===
  const setorResumo = setores.map(s => {
    const rows = dados.filter(d => d.grupo_homogeneo === s);
    const maxRisco = rows.reduce((max, r) => r.grau_risco > max.grau_risco ? r : max, rows[0]);
    const avgScore = Math.round(rows.reduce((a, r) => a + r.score_medio, 0) / rows.length);
    return {
      setor: s,
      funcionarios: rows[0]?.qtd_funcionarios || 0,
      scoreMedia: avgScore,
      riscoMax: maxRisco.classificacao_risco,
      grauMax: maxRisco.grau_risco,
    };
  }).sort((a, b) => b.grauMax - a.grauMax);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Resumo por Setor', 14, summaryY + boxH + 12);

  autoTable(doc, {
    startY: summaryY + boxH + 16,
    head: [['Setor', 'Func.', 'Score Médio', 'Risco Máximo']],
    body: setorResumo.map(s => [
      s.setor,
      String(s.funcionarios),
      `${s.scoreMedia}%`,
      s.riscoMax,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [45, 90, 90],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const risk = data.cell.raw as string;
        const color = RISK_COLORS[risk];
        if (color) {
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fillColor = color;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // === TABELA DETALHADA ===
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const afterFirstTable = (doc as any).lastAutoTable?.finalY || 140;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Detalhamento por Categoria COPSOQ II', 14, afterFirstTable + 12);

  const detailData = [...dados]
    .sort((a, b) => b.grau_risco - a.grau_risco)
    .map(row => [
      row.grupo_homogeneo,
      row.descricao_perigo,
      `${row.score_medio}%`,
      String(row.grau_risco),
      row.classificacao_risco,
      row.medidas_controle,
    ]);

  autoTable(doc, {
    startY: afterFirstTable + 16,
    head: [['Setor', 'Categoria', 'Score', 'Grau', 'Risco', 'Ação Recomendada']],
    body: detailData,
    theme: 'grid',
    headStyles: {
      fillColor: [45, 90, 90],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const risk = data.cell.raw as string;
        const color = RISK_COLORS[risk];
        if (color) {
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fillColor = color;
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // === FOOTER em todas as páginas ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFillColor(45, 90, 90);
    doc.rect(0, pageH - 12, pageWidth, 12, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('M.A.P.A. - Monitoramento e Avaliação de Riscos Psicossociais no Ambiente de Trabalho', 14, pageH - 5);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageH - 5, { align: 'right' });
  }

  // === DOWNLOAD ===
  const fileName = `PGR_${(empresaNome || 'Geral').replace(/\s+/g, '_')}_${now.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}
