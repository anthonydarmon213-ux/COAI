import { prisma } from "@/lib/db/client";

export type AIUsageContext = {
  userId?: string | null;
  feature: string;
};

type TokenUsage = {
  input_tokens: number;
  output_tokens: number;
};

type ModelRates = { inputUsdPerMillion: number; outputUsdPerMillion: number };

export function estimateAIUsageCostUsdMicros(model: string, usage: TokenUsage): number {
  const rates = getModelRates(model);
  // Un token à X $/million coûte exactement X microdollars.
  return Math.max(
    0,
    Math.round(
      usage.input_tokens * rates.inputUsdPerMillion +
        usage.output_tokens * rates.outputUsdPerMillion
    )
  );
}

export async function recordAIUsage(
  model: string,
  usage: TokenUsage,
  context?: AIUsageContext
): Promise<void> {
  if (!context) return;

  try {
    await prisma.aiUsageEvent.create({
      data: {
        userId: context.userId ?? null,
        feature: context.feature.slice(0, 80),
        model: model.slice(0, 120),
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        estimatedCostUsdMicros: estimateAIUsageCostUsdMicros(model, usage),
      },
    });
  } catch (error) {
    // Le suivi financier ne doit jamais bloquer une réponse client.
    console.error("[ai-usage] Enregistrement impossible", error);
  }
}

function getModelRates(model: string): ModelRates {
  const configuredInput = Number(process.env.AI_INPUT_USD_PER_MILLION);
  const configuredOutput = Number(process.env.AI_OUTPUT_USD_PER_MILLION);
  if (configuredInput > 0 && configuredOutput > 0) {
    return { inputUsdPerMillion: configuredInput, outputUsdPerMillion: configuredOutput };
  }

  const normalized = model.toLowerCase();
  if (normalized.includes("haiku")) return { inputUsdPerMillion: 0.8, outputUsdPerMillion: 4 };
  if (normalized.includes("opus")) return { inputUsdPerMillion: 15, outputUsdPerMillion: 75 };
  return { inputUsdPerMillion: 3, outputUsdPerMillion: 15 };
}
