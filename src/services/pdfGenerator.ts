import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, SystemSettings } from '../types';
import { formatFCFA, formatDateDouala, numberToFrenchWords } from '../utils/formatters';

export interface CategorySummaryItem {
  name: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface FinancialReportPDFOptions {
  settings: SystemSettings;
  reportType: 'MENSUEL' | 'ANNUEL';
  periodLabel: string;
  selectedYear: string;
  selectedMonth?: string;
  totalRecettes: number;
  totalDepenses: number;
  soldeNet: number;
  recettesByCategory: CategorySummaryItem[];
  depensesByCategory: CategorySummaryItem[];
  transactions: Transaction[];
  operatorName?: string;
}

/**
 * Génère et télécharge un reçu financier officiel en format PDF (A5 Paysage haute précision)
 */
export function generateReceiptPDF(transaction: Transaction, settings: SystemSettings): void {
  // Format A5 portrait (148 x 210 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pageWidth = 148;
  const pageHeight = 210;
  const isRecette = transaction.type === 'RECETTE';

  // 1. En-tête bandeau supérieur (Couleurs de l'Église : Bleu #4A0E17 & Or #C99B2E)
  doc.setFillColor(74, 14, 23); // #4A0E17
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Liseré or
  doc.setFillColor(201, 155, 46); // #C99B2E
  doc.rect(0, 27, pageWidth, 1.5, 'F');

  // Titres dans l'en-tête
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text((settings?.churchName || 'ÉGLISE MISSIONNAIRE DE LA FOI').toUpperCase(), pageWidth / 2, 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(230, 235, 245);
  doc.text('Paroisse d’Akon • BP 103 Sangmelima, Région du Sud — Cameroun', pageWidth / 2, 14, { align: 'center' });
  doc.text(`Tél : ${settings?.phone || '+237 699 00 11 22'}  |  Email : ${settings?.email || 'contact@emf-sangmelima.org'}`, pageWidth / 2, 18, { align: 'center' });

  // Badge du type de reçu (Caisse / Décaissement)
  const badgeText = isRecette ? 'REÇU OFFICIEL DE CAISSE' : 'BON OFFICIEL DE DÉCAISSEMENT';
  doc.setFillColor(isRecette ? 201 : 220, isRecette ? 155 : 38, isRecette ? 46 : 38);
  doc.roundedRect(pageWidth / 2 - 32, 21.5, 64, 5.5, 1.5, 1.5, 'F');
  doc.setTextColor(isRecette ? 11 : 255, isRecette ? 45 : 255, isRecette ? 84 : 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(badgeText, pageWidth / 2, 25.2, { align: 'center' });

  // 2. Numéro de reçu & Date
  let curY = 35;
  doc.setTextColor(60, 70, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`N° Pièce : `, 12, curY);
  doc.setTextColor(74, 14, 23);
  doc.text(`${transaction.number || 'REC-XXXX'}`, 28, curY);

  doc.setTextColor(60, 70, 85);
  doc.text(`Date d'émission : `, pageWidth - 55, curY);
  doc.setTextColor(15, 23, 42);
  doc.text(formatDateDouala(transaction.date || new Date().toISOString()), pageWidth - 12, curY, { align: 'right' });

  // 3. Cadre Tiers / Bénéficiaire / Donateur
  curY += 6;
  doc.setFillColor(244, 247, 251);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(12, curY, pageWidth - 24, 24, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 115, 130);
  doc.text(isRecette ? 'REÇU DE (DONATEUR / MEMBRE) :' : 'VERSÉ À (BÉNÉFICIAIRE) :', 16, curY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(74, 14, 23);
  doc.text(transaction.counterparty || 'Anonyme / Donateur', 16, curY + 12);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 115, 130);
  doc.text('MOTIF & POSTE COMPTABLE :', 16, curY + 18);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${transaction.categoryName || 'Contribution'}  (${isRecette ? 'Entrée de trésorerie' : 'Sortie autorisée'})`, 16, curY + 22);

  // Mode de paiement à droite
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 115, 130);
  doc.text('MODE DE PAIEMENT :', pageWidth - 16, curY + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text((transaction.paymentMethod || 'ESPÈCES').replace('_', ' '), pageWidth - 16, curY + 12, { align: 'right' });

  // 4. Cadre Principal du Montant (Gros encadré Or & Bleu)
  curY += 28;
  doc.setFillColor(254, 251, 243); // Fond crème doré
  doc.setDrawColor(201, 155, 46); // Liseré or
  doc.setLineWidth(0.6);
  doc.roundedRect(12, curY, pageWidth - 24, 20, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(201, 155, 46);
  doc.text('MONTANT TOTAL EN CHIFFRES :', 16, curY + 6);

  doc.setFont('helvetica', 'black');
  doc.setFontSize(15);
  doc.setTextColor(74, 14, 23);
  doc.text(formatFCFA(transaction.amount || 0), 16, curY + 14);

  // Statut Encaissé / Confirmé à droite
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.3);
  doc.roundedRect(pageWidth - 48, curY + 4, 32, 12, 2, 2, 'FD');
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('✓ VALIDÉ & PAYÉ', pageWidth - 32, curY + 11.5, { align: 'center' });

  // 5. Somme arrêtée en toutes lettres
  curY += 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(12, curY, pageWidth - 24, 15, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('ARRÊTÉ DU MONTANT EN TOUTES LETTRES :', 16, curY + 5);

  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const frenchWords = `« ${numberToFrenchWords(transaction.amount || 0)} »`;
  const splitWords = doc.splitTextToSize(frenchWords, pageWidth - 32);
  doc.text(splitWords, 16, curY + 10);

  // 6. Description / Motif complémentaire
  curY += 19;
  if (transaction.description) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('DESCRIPTION / OBSERVATIONS :', 12, curY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const splitDesc = doc.splitTextToSize(transaction.description, pageWidth - 24);
    doc.text(splitDesc, 12, curY + 4.5);
    curY += splitDesc.length * 4.5 + 4;
  } else {
    curY += 2;
  }

  // 7. Zones de Signatures & Cachet
  curY = Math.max(curY, 140);
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.line(12, curY, pageWidth - 12, curY);
  doc.setLineDashPattern([], 0); // reset dash

  curY += 6;
  // Colonne Gauche : Partie versante
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Pour la Partie Versante :', 16, curY);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('(Signature du donateur / déposant)', 16, curY + 18);
  doc.line(16, curY + 16, 56, curY + 16);

  // Colonne Droite : Trésorerie Paroissiale
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Pour la Trésorerie EMF Sangmelima :', pageWidth - 16, curY, { align: 'right' });

  // Tampon comptable stylisé
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.4);
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(pageWidth - 58, curY + 3.5, 42, 10, 1.5, 1.5, 'FD');
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('CONTRÔLÉ & CACHETÉ', pageWidth - 37, curY + 8, { align: 'center' });
  doc.text('Trésorerie Paroissiale', pageWidth - 37, curY + 11.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Opérateur : ${transaction.userName || 'Trésorier de permanence'}`, pageWidth - 16, curY + 18, { align: 'right' });

  // 8. Pied de page certifié
  doc.setFillColor(241, 245, 249);
  doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('EMF SMART • Gestion Financière & Paroissiale • Église Missionnaire de la Foi de Sangmelima', pageWidth / 2, pageHeight - 7, { align: 'center' });
  doc.text(`Ce reçu est certifié conforme. Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, pageWidth / 2, pageHeight - 3.5, { align: 'center' });

  // Sauvegarde et téléchargement immédiat
  const cleanNum = (transaction.number || 'RECU').replace(/[^a-zA-Z0-9-_]/g, '_');
  const cleanName = (transaction.counterparty || 'Donateur').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
  doc.save(`Recu_${cleanNum}_${cleanName}.pdf`);
}

/**
 * Génère et télécharge le Rapport Financier Officiel complet (Mensuel ou Annuel) en format PDF (A4 Portrait)
 */
export function generateFinancialReportPDF(options: FinancialReportPDFOptions): void {
  const {
    settings,
    reportType,
    periodLabel,
    selectedYear,
    selectedMonth,
    totalRecettes,
    totalDepenses,
    soldeNet,
    recettesByCategory,
    depensesByCategory,
    transactions,
    operatorName = 'Trésorerie Paroissiale',
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // 1. Bandeau supérieur officiel (Bleu Marine & Or)
  doc.setFillColor(74, 14, 23); // #4A0E17
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Liseré or
  doc.setFillColor(201, 155, 46); // #C99B2E
  doc.rect(0, 31, pageWidth, 2, 'F');

  // Titres en-tête
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text((settings?.churchName || 'ÉGLISE MISSIONNAIRE DE LA FOI').toUpperCase(), pageWidth / 2, 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 230, 245);
  doc.text('Paroisse de Sangmelima • BP 103 Quartier Akon • Sud, Cameroun', pageWidth / 2, 16, { align: 'center' });
  doc.text(`Tél : ${settings?.phone || '+237 699 00 11 22'}  |  Email : ${settings?.email || 'contact@emf-sangmelima.org'}`, pageWidth / 2, 21, { align: 'center' });

  // Titre du document
  doc.setTextColor(255, 215, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`RAPPORT FINANCIER OFFICIEL — ${reportType === 'ANNUEL' ? 'ANNÉE ' + selectedYear : periodLabel.toUpperCase()}`, pageWidth / 2, 28, { align: 'center' });

  // 2. Fiche d'identification du rapport
  let curY = 40;
  doc.setFillColor(244, 247, 251);
  doc.setDrawColor(218, 226, 237);
  doc.roundedRect(14, curY, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(74, 14, 23);
  doc.text('PÉRIODE COMPTABLE :', 18, curY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(periodLabel, 55, curY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(74, 14, 23);
  doc.text('DATE D’EXTRACTION :', 18, curY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, 55, curY + 11);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(74, 14, 23);
  doc.text('OPÉRATEUR :', pageWidth - 80, curY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(operatorName, pageWidth - 55, curY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(74, 14, 23);
  doc.text('TOTAL OPÉRATIONS :', pageWidth - 80, curY + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${transactions.length} écritures validées`, pageWidth - 46, curY + 11);

  // 3. Cadres Résumé Synthétique (3 Blocs : Recettes, Dépenses, Solde Net)
  curY += 19;
  const boxWidth = (pageWidth - 28 - 8) / 3;

  // Box 1 : Recettes
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14, curY, boxWidth, 22, 2, 2, 'FD');
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TOTAL RECETTES (ENTRÉES)', 14 + boxWidth / 2, curY + 6, { align: 'center' });
  doc.setFontSize(12);
  doc.text(formatFCFA(totalRecettes), 14 + boxWidth / 2, curY + 14, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${recettesByCategory.reduce((s, c) => s + c.count, 0)} opérations`, 14 + boxWidth / 2, curY + 19, { align: 'center' });

  // Box 2 : Dépenses
  const xDep = 14 + boxWidth + 4;
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(xDep, curY, boxWidth, 22, 2, 2, 'FD');
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('TOTAL DÉPENSES (SORTIES)', xDep + boxWidth / 2, curY + 6, { align: 'center' });
  doc.setFontSize(12);
  doc.text(formatFCFA(totalDepenses), xDep + boxWidth / 2, curY + 14, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${depensesByCategory.reduce((s, c) => s + c.count, 0)} opérations`, xDep + boxWidth / 2, curY + 19, { align: 'center' });

  // Box 3 : Solde Net
  const xSolde = xDep + boxWidth + 4;
  const isPos = soldeNet >= 0;
  doc.setFillColor(isPos ? 239 : 255, isPos ? 246 : 241, isPos ? 255 : 242);
  doc.setDrawColor(isPos ? 147 : 254, isPos ? 197 : 202, isPos ? 253 : 202);
  doc.roundedRect(xSolde, curY, boxWidth, 22, 2, 2, 'FD');
  doc.setTextColor(isPos ? 37 : 220, isPos ? 99 : 38, isPos ? 235 : 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SOLDE NET DE LA PÉRIODE', xSolde + boxWidth / 2, curY + 6, { align: 'center' });
  doc.setFontSize(12);
  doc.text(formatFCFA(soldeNet), xSolde + boxWidth / 2, curY + 14, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(isPos ? 'Excédent d’exercice' : 'Déficit d’exercice', xSolde + boxWidth / 2, curY + 19, { align: 'center' });

  curY += 28;

  // 4. Table 1 : Détail des Recettes par Catégorie
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(74, 14, 23);
  doc.text('1. Ventilation des Recettes (Dîmes, Offrandes, Dons)', 14, curY);

  const recettesRows = recettesByCategory.map((c) => [
    c.name,
    String(c.count),
    formatFCFA(c.amount),
    `${c.percentage.toFixed(1)} %`,
  ]);

  // Ligne de total
  recettesRows.push([
    'TOTAL DES RECETTES',
    String(recettesByCategory.reduce((s, c) => s + c.count, 0)),
    formatFCFA(totalRecettes),
    '100.0 %',
  ]);

  autoTable(doc, {
    startY: curY + 2.5,
    margin: { left: 14, right: 14 },
    head: [['Poste de Recette', 'Nb Dons', 'Montant Encaissé (FCFA)', 'Part (%)']],
    body: recettesRows,
    theme: 'striped',
    headStyles: {
      fillColor: [74, 14, 23],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 45, fontStyle: 'bold' },
      3: { halign: 'right', cellWidth: 32 },
    },
    didParseCell: (data) => {
      // Highlight the total row
      if (data.row.index === recettesRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 253, 244];
        data.cell.styles.textColor = [5, 150, 105];
      }
    },
  });

  curY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : curY + 45;

  // 5. Table 2 : Détail des Dépenses par Catégorie
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(74, 14, 23);
  doc.text('2. Ventilation des Dépenses (Fonctionnement, Social, Travaux)', 14, curY);

  const depensesRows = depensesByCategory.map((c) => [
    c.name,
    String(c.count),
    formatFCFA(c.amount),
    `${c.percentage.toFixed(1)} %`,
  ]);

  // Ligne de total
  depensesRows.push([
    'TOTAL DES DÉPENSES',
    String(depensesByCategory.reduce((s, c) => s + c.count, 0)),
    formatFCFA(totalDepenses),
    '100.0 %',
  ]);

  autoTable(doc, {
    startY: curY + 2.5,
    margin: { left: 14, right: 14 },
    head: [['Poste de Dépense', 'Nb Opér.', 'Montant Décaissé (FCFA)', 'Part (%)']],
    body: depensesRows,
    theme: 'striped',
    headStyles: {
      fillColor: [185, 28, 28],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 80, fontStyle: 'bold' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 45, fontStyle: 'bold' },
      3: { halign: 'right', cellWidth: 32 },
    },
    didParseCell: (data) => {
      // Highlight the total row
      if (data.row.index === depensesRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [254, 242, 242];
        data.cell.styles.textColor = [185, 28, 28];
      }
    },
  });

  curY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : curY + 45;

  // Si on est trop bas sur la page 1, ouvrir une page 2 pour le grand livre
  if (curY > pageHeight - 50) {
    doc.addPage();
    curY = 20;
  }

  // 6. Table 3 : Grand Livre / Journal des écritures comptables
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(74, 14, 23);
  doc.text('3. Grand Livre des Écritures Comptables de la Période', 14, curY);

  const sortedJournalTxs = [...transactions].sort((a, b) => {
    return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
  });

  const journalRows = sortedJournalTxs.map((t) => [
    formatDateDouala(t.date || ''),
    t.number || '',
    t.type === 'RECETTE' ? 'RECETTE' : 'DÉPENSE',
    t.categoryName || '',
    t.counterparty || 'Anonyme',
    (t.paymentMethod || 'ESPÈCES').replace('_', ' '),
    formatFCFA(t.amount || 0),
  ]);

  autoTable(doc, {
    startY: curY + 2.5,
    margin: { left: 14, right: 14, bottom: 20 },
    head: [['Date', 'N° Pièce', 'Type', 'Catégorie', 'Tiers / Donateur', 'Mode', 'Montant (FCFA)']],
    body: journalRows,
    theme: 'grid',
    headStyles: {
      fillColor: [74, 14, 23],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 32 },
      4: { cellWidth: 35 },
      5: { cellWidth: 22 },
      6: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'RECETTE') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  // 7. Signature & Certification Box
  let finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : curY + 45;
  if (finalY > pageHeight - 40) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, finalY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(74, 14, 23);
  doc.text('CERTIFICATION DU RAPPORT PAR LA COMMISSION DES FINANCES :', 18, finalY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Le présent rapport financier a été arrêté, certifié sincère et conforme aux livres de comptes de la paroisse.', 18, finalY + 9);

  // Colonne Signatures
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Le Trésorier Titulaire', 30, finalY + 16);
  doc.text('Le Conseil Pastoral', pageWidth / 2, finalY + 16);
  doc.text('Le Pasteur Responsable', pageWidth - 50, finalY + 16);

  // 8. Pagination sur toutes les pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(241, 245, 249);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Église Missionnaire de la Foi — Sangmelima • Document Financier Officiel • Page ${i} sur ${totalPages}`,
      pageWidth / 2,
      pageHeight - 4,
      { align: 'center' }
    );
  }

  // Sauvegarde
  const cleanType = reportType.toLowerCase();
  const cleanPeriod = (selectedMonth ? `${selectedYear}_${selectedMonth}` : selectedYear).replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Rapport_Financier_EMF_${cleanType}_${cleanPeriod}.pdf`);
}
