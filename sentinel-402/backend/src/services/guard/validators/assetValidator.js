import { isAddress } from "viem";

export function validateAsset(asset, policy) {
  if (
    typeof asset !== "string" ||
    !isAddress(asset, { strict: false })
  ) {
    return [{
      code: "INVALID_ASSET",
      message: "Invalid token contract address"
    }];
  }

  const allowed = policy.allowedAssets.some(
    address => address.toLowerCase() === asset.toLowerCase()
  );

  if (!allowed) {
    return [{
      code: "UNAUTHORIZED_ASSET",
      message: "Token is not approved"
    }];
  }

  return [];
}