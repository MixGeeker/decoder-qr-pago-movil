export const validateAmount = (raw: string): string => {
  // 1. Auto-corregir: punto → coma ("150.00" → "150,00")
  let amount = raw.includes(".") ? raw.replace(".", ",") : raw;

  // 2. Auto-corregir: sin decimales → agregar ",00" ("150" → "150,00")
  if (!amount.includes(",")) {
    amount = amount + ",00";
  }

  // 3. Auto-corregir: un solo decimal → agregar "0" ("150,5" → "150,50")
  const parts = amount.split(",");
  if (parts.length === 2 && parts[1]?.length === 1) {
    amount = parts[0] + "," + parts[1] + "0";
  }

  // 4. Validar contra el regex original del banco
  const regex = /^([0-9][0-9]|[1-9][0-9]{1,7}),[0-9]{2}$/;
  if (!regex.test(amount)) {
    throw new Error(
      `Monto inválido: "${raw}". Formato requerido: XX,XX (ej: "150,00"). ` +
        `Máximo 8 dígitos enteros, exactamente 2 decimales con coma.`,
    );
  }

  // 5. Validar > 0 (idéntico al código original Utils.isValidAmount)
  const numericValue = parseFloat(amount.replace(",", "."));
  if (numericValue <= 0) {
    throw new Error("El monto debe ser mayor a 0");
  }

  return amount;
};
