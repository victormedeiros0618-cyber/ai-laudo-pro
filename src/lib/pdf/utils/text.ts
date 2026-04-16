/**
 * utils/text.ts — Helpers de texto para PDFs em português
 */

/** Mapa de números por extenso (1-200) — suficiente para qualquer laudo */
const EXTENSO_UNIDADES = [
  '', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove',
  'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete',
  'dezoito', 'dezenove',
];

const EXTENSO_DEZENAS = [
  '', '', 'vinte', 'trinta', 'quarenta', 'cinquenta',
  'sessenta', 'setenta', 'oitenta', 'noventa',
];

const EXTENSO_CENTENAS = [
  '', 'cento', 'duzentas', 'trezentas',
];

/**
 * Converte número para extenso feminino (para "folhas").
 * Ex: 34 → "trinta e quatro", 1 → "uma", 100 → "cem"
 */
export function numeroPorExtenso(n: number): string {
  if (n <= 0) return 'zero';
  if (n < 20) return EXTENSO_UNIDADES[n];
  if (n < 100) {
    const dezena = EXTENSO_DEZENAS[Math.floor(n / 10)];
    const unidade = EXTENSO_UNIDADES[n % 10];
    return unidade ? `${dezena} e ${unidade}` : dezena;
  }
  if (n === 100) return 'cem';
  if (n < 200) {
    return `cento e ${numeroPorExtenso(n - 100)}`;
  }
  if (n < 400) {
    const centena = EXTENSO_CENTENAS[Math.floor(n / 100)];
    const resto = n % 100;
    return resto ? `${centena} e ${numeroPorExtenso(resto)}` : centena;
  }
  // Fallback para números maiores
  return String(n);
}

/**
 * Formata data ISO → "DD de mês de AAAA" (extenso em português).
 * Ex: "2026-04-16" → "16 de abril de 2026"
 */
export function formatDateExtenso(isoDate: string): string {
  const meses = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
  ];
  try {
    const d = new Date(isoDate + 'T12:00:00'); // Avoid timezone issues
    const dia = d.getDate();
    const mes = meses[d.getMonth()];
    const ano = d.getFullYear();
    return `${dia} de ${mes} de ${ano}`;
  } catch {
    return isoDate;
  }
}

/**
 * Formata data ISO → "DD/MM/AAAA"
 */
export function formatDateShort(isoDate: string): string {
  try {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString('pt-BR');
  } catch {
    return isoDate;
  }
}

/**
 * Capitaliza a primeira letra.
 */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Gera o texto padrão de encerramento IBAPE/CONFEA.
 */
export function textoEncerramento(totalPaginas: number, cidade: string, dataExtenso: string): string {
  const ext = numeroPorExtenso(totalPaginas);
  return (
    `Nada mais havendo a esclarecer, encerramos o presente Laudo Técnico, ` +
    `composto por ${totalPaginas} (${ext}) folhas digitadas em um só lado, ` +
    `incluindo a presente, devidamente assinadas.\n\n` +
    `${cidade}, ${dataExtenso}.`
  );
}
