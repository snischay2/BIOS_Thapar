export function validateNetwork(network, policy) {
  if (
    typeof network !== "string" ||
    !policy.allowedNetworks.includes(network)
  ) {
    return [{
      code: "UNAUTHORIZED_NETWORK",
      message: "Blockchain network is not approved"
    }];
  }

  return [];
}