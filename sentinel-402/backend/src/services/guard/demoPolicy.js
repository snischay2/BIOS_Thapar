
const MERCHANT_WALLET = "0x179f0073e4105b37dadb28e87D581Aa443D81986";
const MERCHANT_ORIGIN =
  process.env.MERCHANT_ORIGIN || "http://localhost:5001";

export const demoPolicy = {
  agentId: "agent-001",

  allowedSchemes: ["exact"],
  allowedNetworks: ["eip155:84532"],

  allowedAssets: [
    "0x036CbD53842c5426634e7929541eC2318f3dCF7e"
  ],

  allowedRecipients: [MERCHANT_WALLET],

  maxPaymentAtomic: "500000",
  dailyLimitAtomic: "2000000",
  spentTodayAtomic: "0",
  maxTimeoutSeconds: 300
};

export const demoMerchants = [
  {
    id: "local-weather-demo",
    origin: MERCHANT_ORIGIN.replace(/\/+$/, ""),
    expectedPayTo: MERCHANT_WALLET
  }
];
