// Indian number formatting (en-IN locale → 1,23,456 grouping)
// Drops paise when amount is a whole rupee value, shows them otherwise.

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const inrFormatterPaise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const n = Number(amount);
  return Number.isInteger(n) ? inrFormatter.format(n) : inrFormatterPaise.format(n);
}

// Plain Indian number (no ₹) for inputs/display
export function formatIndianNumber(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  const n = Number(amount);
  const opts = Number.isInteger(n)
    ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  return new Intl.NumberFormat('en-IN', opts).format(n);
}

// Parse user input "1,234.56" → 1234.56
export function parseAmount(input) {
  if (typeof input === 'number') return input;
  if (!input) return 0;
  const cleaned = String(input).replace(/[^\d.]/g, '');
  return parseFloat(cleaned) || 0;
}
