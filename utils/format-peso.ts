// "₱2,750.00": pesos with thousands separators and two decimals, the same way
// the Students directory and the Officer pages write amounts.
export function formatPeso(amount: unknown) {
  return `₱${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
