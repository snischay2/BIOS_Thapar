export function validateAmount(amount, policy) {
  const errors = [];

  try {
    if (
      typeof amount !== "string" ||
      !/^\d+$/.test(amount)
    ) {
      throw new Error("Invalid amount format");
    }

    const requested = BigInt(amount);
    const maxPayment = BigInt(policy.maxPaymentAtomic);
    const dailyLimit = BigInt(policy.dailyLimitAtomic);
    const spentToday = BigInt(policy.spentTodayAtomic);

    if (requested <= 0n) {
      errors.push({
        code: "INVALID_AMOUNT",
        message: "Payment amount must be greater than zero"
      });

      return errors;
    }

    if (requested > maxPayment) {
      errors.push({
        code: "PAYMENT_LIMIT_EXCEEDED",
        message: "Payment exceeds maximum transaction limit"
      });
    }

    if (spentToday + requested > dailyLimit) {
      errors.push({
        code: "DAILY_LIMIT_EXCEEDED",
        message: "Daily spending limit exceeded"
      });
    }

  } catch {
    errors.push({
      code: "INVALID_AMOUNT",
      message: "Payment amount is invalid"
    });
  }

  return errors;
}