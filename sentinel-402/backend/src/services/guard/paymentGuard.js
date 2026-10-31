
import { isAddress } from "viem";

function block(code, message) {
  return {
    approved: false,
    decision: "BLOCK",
    selectedRequirement: null,
    reasons: [{ code, message }]
  };
}

function addressEquals(a, b) {
  return (
    typeof a === "string" &&
    typeof b === "string" &&
    a.toLowerCase() === b.toLowerCase()
  );
}

function isPositiveIntegerString(value) {
  return (
    typeof value === "string" &&
    /^\d+$/.test(value) &&
    BigInt(value) > 0n
  );
}

function validLimit(value) {
  return (
    typeof value === "string" &&
    /^\d+$/.test(value)
  );
}

function validPolicy(policy) {
  if (!policy || typeof policy !== "object") return false;

  return (
    Array.isArray(policy.allowedSchemes) &&
    Array.isArray(policy.allowedNetworks) &&
    Array.isArray(policy.allowedAssets) &&
    Array.isArray(policy.allowedRecipients) &&
    validLimit(policy.maxPaymentAtomic) &&
    validLimit(policy.dailyLimitAtomic) &&
    validLimit(policy.spentTodayAtomic) &&
    Number.isSafeInteger(policy.maxTimeoutSeconds) &&
    policy.maxTimeoutSeconds > 0
  );
}

function isTrustedResource(resourceUrl, merchants) {
  try {
    const url = new URL(resourceUrl);

    const secureProtocol = url.protocol === "https:";

    const localDevelopment =
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

    if (
      (!secureProtocol && !localDevelopment) ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return merchants.find(merchant => {
      if (!merchant || typeof merchant.origin !== "string") {
        return false;
      }

      const trustedOrigin = new URL(merchant.origin);

      if (trustedOrigin.origin !== url.origin) {
        return false;
      }

      // Optional strict endpoint allowlist.
      if (Array.isArray(merchant.allowedPaths)) {
        return merchant.allowedPaths.includes(url.pathname);
      }

      return true;
    }) ?? null;

  } catch {
    return null;
  }
}

function inspectRequirement(requirement, policy, merchant) {
  const errors = [];

  if (!requirement || typeof requirement !== "object") {
    return [{
      code: "INVALID_REQUIREMENT",
      message: "Invalid payment option"
    }];
  }

  if (
    typeof requirement.scheme !== "string" ||
    !policy.allowedSchemes.includes(requirement.scheme)
  ) {
    errors.push({
      code: "UNAUTHORIZED_SCHEME",
      message: "Payment scheme is not approved"
    });
  }

  if (
    typeof requirement.network !== "string" ||
    !policy.allowedNetworks.includes(requirement.network)
  ) {
    errors.push({
      code: "UNAUTHORIZED_NETWORK",
      message: "Blockchain network is not approved"
    });
  }

  if (
    typeof requirement.asset !== "string" ||
    !isAddress(requirement.asset, { strict: false }) ||
    !policy.allowedAssets.some(asset =>
      addressEquals(asset, requirement.asset)
    )
  ) {
    errors.push({
      code: "UNAUTHORIZED_ASSET",
      message: "Token contract is invalid or not approved"
    });
  }

  if (!isPositiveIntegerString(requirement.amount)) {
    errors.push({
      code: "INVALID_AMOUNT",
      message: "Payment amount must be a positive integer string"
    });
  } else {
    const amount = BigInt(requirement.amount);

    if (amount > BigInt(policy.maxPaymentAtomic)) {
      errors.push({
        code: "PAYMENT_LIMIT_EXCEEDED",
        message: "Payment exceeds the per-transaction limit"
      });
    }

    if (
      BigInt(policy.spentTodayAtomic) + amount >
      BigInt(policy.dailyLimitAtomic)
    ) {
      errors.push({
        code: "DAILY_LIMIT_EXCEEDED",
        message: "Daily spending limit exceeded"
      });
    }
  }

  if (
    typeof requirement.payTo !== "string" ||
    !isAddress(requirement.payTo, { strict: false }) ||
    !isAddress(merchant.expectedPayTo, { strict: false }) ||
    !addressEquals(requirement.payTo, merchant.expectedPayTo) ||
    !policy.allowedRecipients.some(address =>
      addressEquals(address, requirement.payTo)
    )
  ) {
    errors.push({
      code: "RECIPIENT_MISMATCH",
      message: "Payment recipient is not trusted"
    });
  }

  if (
    !Number.isSafeInteger(requirement.maxTimeoutSeconds) ||
    requirement.maxTimeoutSeconds <= 0 ||
    requirement.maxTimeoutSeconds > policy.maxTimeoutSeconds
  ) {
    errors.push({
      code: "INVALID_TIMEOUT",
      message: "Payment timeout violates policy"
    });
  }

  return errors;
}

export function evaluatePaymentRequired({
  paymentRequired,
  policy,
  merchants
}) {
  if (!validPolicy(policy) || !Array.isArray(merchants)) {
    return block(
      "POLICY_UNAVAILABLE",
      "Trusted security policy is unavailable or malformed"
    );
  }

  if (
    !paymentRequired ||
    typeof paymentRequired !== "object" ||
    paymentRequired.x402Version !== 2
  ) {
    return block(
      "INVALID_PROTOCOL_VERSION",
      "Only valid x402 V2 payment challenges are accepted"
    );
  }

  if (
    !paymentRequired.resource ||
    typeof paymentRequired.resource.url !== "string"
  ) {
    return block(
      "INVALID_RESOURCE",
      "Payment resource information is missing"
    );
  }

  const merchant = isTrustedResource(
    paymentRequired.resource.url,
    merchants
  );

  if (!merchant) {
    return block(
      "UNTRUSTED_MERCHANT",
      "Resource does not belong to a trusted merchant"
    );
  }

  if (
    !Array.isArray(paymentRequired.accepts) ||
    paymentRequired.accepts.length === 0
  ) {
    return block(
      "NO_PAYMENT_OPTIONS",
      "No acceptable payment options were supplied"
    );
  }

  const candidates = paymentRequired.accepts.map(
    (requirement, index) => ({
      index,
      requirement,
      errors: inspectRequirement(requirement, policy, merchant)
    })
  );

  const approved = candidates
    .filter(candidate => candidate.errors.length === 0)
    .sort((a, b) => {
      const amountA = BigInt(a.requirement.amount);
      const amountB = BigInt(b.requirement.amount);

      return amountA < amountB ? -1 : amountA > amountB ? 1 : 0;
    });

  if (approved.length === 0) {
    return {
      approved: false,
      decision: "BLOCK",
      selectedRequirement: null,
      reasons: candidates.flatMap(candidate =>
        candidate.errors.map(error => ({
          ...error,
          optionIndex: candidate.index
        }))
      )
    };
  }

  return {
    approved: true,
    decision: "ALLOW",
    merchantId: merchant.id,
    selectedRequirement: approved[0].requirement,
    reasons: []
  };
}
