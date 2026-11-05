export function formatCurrency(value: number): string {
  if (isNaN(value)) value = 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  // Avoid timezone offset issue by parsing YYYY-MM-DD parts
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  }
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
}

export function formatShortDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    const [, month, day] = parts;
    return `${day}/${month}`;
  }
  return formatDate(dateString);
}

export function getMonthName(monthNumber: number): string {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[monthNumber] || '';
}

export function formatMonthYear(yearMonth: string): string {
  // yearMonth format: 'YYYY-MM'
  const [yearStr, monthStr] = yearMonth.split('-');
  const month = parseInt(monthStr, 10) - 1;
  return `${getMonthName(month)} de ${yearStr}`;
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function parseCurrencyInput(valueStr: string): number {
  if (!valueStr) return 0;
  // Cleans "R$ 1.250,50" -> 1250.50
  const clean = valueStr
    .replace(/[^\d,-]/g, '')
    .replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}
