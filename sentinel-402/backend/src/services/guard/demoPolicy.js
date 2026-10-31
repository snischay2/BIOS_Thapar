const merchantPayTo = process.env.MERCHANT_PAY_TO;

const usdcAddress =
  process.env.BASE_SEPOLIA_USDC_ADDRESS ||
  "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

const merchantOrigin =
  process.env.MERCHANT_ORIGIN ||
  "http://localhost:5001";

export const demoPolicy = {
  agentId: "agent-001",

  allowedSchemes: ["exact"],

  allowedNetworks: [
    "eip155:84532"
  ],

  allowedAssets: [
    usdcAddress
  ],

  allowedRecipients: merchantPayTo
    ? [merchantPayTo]
    : [],

  maxPaymentAtomic: "500000",

  dailyLimitAtomic: "2000000",

  spentTodayAtomic: "0",

  maxTimeoutSeconds: 300
};

export const demoMerchants = [
  {
    id: "local-weather-demo",

    origin: merchantOrigin,

    expectedPayTo: merchantPayTo
  }
];