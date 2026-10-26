/**
 * Formatters and helpers for EMF SMART (Sangmelima, Cameroun)
 */

export function formatFCFA(amount: number): string {
  if (isNaN(amount)) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  }).format(amount).replace('FCFA', 'FCFA').replace('XAF', 'FCFA');
}

export function formatDateDouala(dateStr: string, includeTime = false): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Africa/Douala',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    };
    return new Intl.DateTimeFormat('fr-FR', options).format(d);
  } catch (e) {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Africa/Douala',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

// Convert numbers to French words for official receipts
export function numberToFrenchWords(n: number): string {
  if (n === 0) return 'Zéro Franc CFA';
  
  const units = ['', 'Un', 'Deux', 'Trois', 'Quatre', 'Cinq', 'Six', 'Sept', 'Huit', 'Neuf'];
  const teens = ['Dix', 'Onze', 'Douze', 'Treize', 'Quatorze', 'Quinze', 'Seize', 'Dix-sept', 'Dix-huit', 'Dix-neuf'];
  const tens = ['', 'Dix', 'Vingt', 'Trente', 'Quarante', 'Cinquante', 'Soixante', 'Soixante-dix', 'Quatre-vingts', 'Quatre-vingt-dix'];

  function convertGroup(val: number): string {
    let res = '';
    const h = Math.floor(val / 100);
    const rem = val % 100;

    if (h > 0) {
      if (h === 1) {
        res += 'Cent ';
      } else {
        res += units[h] + ' Cents ';
      }
    }

    if (rem > 0) {
      if (rem < 10) {
        res += units[rem] + ' ';
      } else if (rem < 20) {
        res += teens[rem - 10] + ' ';
      } else {
        const t = Math.floor(rem / 10);
        const u = rem % 10;
        if (t === 7) {
          res += 'Soixante-' + teens[u] + ' ';
        } else if (t === 9) {
          res += 'Quatre-vingt-' + teens[u] + ' ';
        } else {
          res += tens[t] + (u === 1 && t !== 8 ? ' et Un ' : u > 0 ? '-' + units[u] + ' ' : ' ');
        }
      }
    }
    return res.trim();
  }

  const millions = Math.floor(n / 1000000);
  const thousands = Math.floor((n % 1000000) / 1000);
  const remainder = n % 1000;

  let result = '';
  if (millions > 0) {
    result += (millions === 1 ? 'Un Million ' : convertGroup(millions) + ' Millions ');
  }
  if (thousands > 0) {
    result += (thousands === 1 ? 'Mille ' : convertGroup(thousands) + ' Mille ');
  }
  if (remainder > 0) {
    result += convertGroup(remainder) + ' ';
  }

  return (result.trim() + ' Francs CFA').trim();
}
