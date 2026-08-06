// Formats a numeric amount as Indian Rupees, e.g. formatINR(15999) -> "₹15,999"
export const formatINR = (amount) => {
  const num = Number(amount);
  if (Number.isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};
