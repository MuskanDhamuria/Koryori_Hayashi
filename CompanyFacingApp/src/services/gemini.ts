import { GoogleGenAI } from '@google/genai';
import { AiContextPayload } from '../types';
import { formatPercent } from '../utils/format';

const FALLBACK_KEY = 'GEMINI_KEY';

export function getGeminiApiKey() {
  return import.meta.env.VITE_GEMINI_API_KEY?.trim() || FALLBACK_KEY;
}

export function isGeminiConfigured(apiKey = getGeminiApiKey()) {
  return Boolean(apiKey) && apiKey !== FALLBACK_KEY;
}

function buildPrompt(context: AiContextPayload, question: string) {
  return [
    'You are an operations strategist for a restaurant analytics dashboard.',
    'Answer clearly and concretely using the dataset provided below.',
    'Use bullet points only when they improve clarity. Mention risks, numeric signals, and recommended actions.',
    'If asked about forecasting or inventory, connect the answer to reorder quantities, staffing, waste, and margins whenever relevant.',
    '',
    'DATA SNAPSHOT:',
    JSON.stringify(context, null, 2),
    '',
    `USER QUESTION: ${question}`,
  ].join('\n');
}

export async function askGemini(context: AiContextPayload, question: string) {
  const apiKey = getGeminiApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: buildPrompt(context, question),
  });

  return response.text || 'Gemini returned an empty response.';
}

export function buildFallbackAssistantReply(context: AiContextPayload, question: string) {
  const topItem = context.topItems[0];
  const slowItem = context.slowItems[0];
  const peakSlots = context.slotForecast.filter((slot) => slot.isPeak).slice(0, 3);
  const firstRisk = context.inventoryRisks.find((risk) => risk.stockoutRisk);
  const firstWaste = context.wasteAlerts[0];
  const firstMargin = context.marginInsights[0];

  const highlights = [
    `Local fallback summary for: "${question}"`,
    `Top seller: ${topItem?.name ?? 'n/a'} with ${topItem?.quantity ?? 0} units and margin ${topItem ? formatPercent(topItem.margin) : '0.0%'}.`,
    `Slow mover: ${slowItem?.name ?? 'n/a'} with ${slowItem?.quantity ?? 0} units.`,
    peakSlots.length
      ? `Peak staffing window(s): ${peakSlots.map((slot) => `${slot.label} (${slot.recommendedStaff} staff)`).join(', ')}.`
      : 'No peak staffing windows detected from the current forecast.',
    firstRisk
      ? `Immediate reorder priority: ${firstRisk.name}, recommended order ${firstRisk.recommendedOrderQuantity.toFixed(1)} units.`
      : 'No stockout warnings triggered right now.',
    firstWaste
      ? `Waste risk to review: ${firstWaste.name}, projected waste ${firstWaste.projectedWasteQuantity.toFixed(1)} ${firstWaste.unit}.`
      : 'No waste alerts triggered right now.',
    firstMargin
      ? `Best margin improvement opportunity: ${firstMargin.name}, potential weekly profit lift ${firstMargin.potentialWeeklyProfitLift.toFixed(2)}.`
      : 'No margin improvement flags exceeded the configured target threshold.',
    'Replace VITE_GEMINI_API_KEY=GEMINI_KEY in .env with a real Gemini key to switch from this deterministic fallback to live AI answers.',
  ];

  return highlights.join('\n\n');
}
