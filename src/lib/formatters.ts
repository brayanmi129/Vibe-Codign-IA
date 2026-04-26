export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const generateProductCode = (name: string) => {
  const prefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X').padEnd(3, 'X');
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}${random}`;
};
