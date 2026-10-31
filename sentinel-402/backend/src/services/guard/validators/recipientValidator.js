import { isAddress } from "viem";

export function validateRecipient(
  requestedRecipient,
  merchant,
  policy
) {
  const errors = [];

  if (
    typeof requestedRecipient !== "string" ||
    !isAddress(requestedRecipient, { strict: false })
  ) {
    return [{
      code: "INVALID_RECIPIENT",
      message: "Invalid recipient address"
    }];
  }

  if (
    !merchant?.expectedPayTo ||
    !isAddress(merchant.expectedPayTo, { strict: false })
  ) {
    return [{
      code: "INVALID_TRUSTED_MERCHANT",
      message: "Trusted merchant configuration is invalid"
    }];
  }

  const requested = requestedRecipient.toLowerCase();
  const expected = merchant.expectedPayTo.toLowerCase();

  if (requested !== expected) {
    errors.push({
      code: "RECIPIENT_MISMATCH",
      message: "Payment recipient does not match trusted merchant"
    });
  }

  const allowed = policy.allowedRecipients.some(
    address => address.toLowerCase() === requested
  );

  if (!allowed) {
    errors.push({
      code: "RECIPIENT_NOT_ALLOWED",
      message: "Recipient is not in the approved address list"
    });
  }

  return errors;
}