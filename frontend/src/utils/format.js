export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function stockHealthColor(quantity, threshold) {
  if (quantity <= 0) return 'var(--danger)';
  if (quantity <= threshold) return 'var(--warn)';
  return 'var(--accent)';
}

export function stockHealthPercent(quantity, threshold) {
  const capacity = Math.max(threshold * 3, quantity, 1);
  return Math.min(100, Math.round((quantity / capacity) * 100));
}