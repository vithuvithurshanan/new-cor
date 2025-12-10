
import { GoogleGenAI } from "@google/genai";
import { Shipment, DashboardStats, PricingConfig } from "../types";

const getClient = () => {
  // Safe access to process.env for browser environments
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will strictly mock responses if not handled.");
  }
  return new GoogleGenAI({ apiKey: apiKey || "dummy-key" });
};

export const generateLogisticsReport = async (stats: DashboardStats, recentShipments: Shipment[]): Promise<string> => {
  try {
    const ai = getClient();

    const prompt = `
      Analyze the following logistics data and provide a concise executive summary (max 150 words).
      Focus on efficiency, potential risks, and actionable advice.
      
      Stats:
      ${JSON.stringify(stats)}
      
      Recent Shipment Samples:
      ${JSON.stringify(recentShipments.slice(0, 3))}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Logistics Operations Manager AI. Be professional, concise, and data-driven.",
        temperature: 0.3,
      }
    });

    return response.text || "Unable to generate report.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Analysis unavailable. Please ensure a valid API Key is configured.";
  }
};

export const chatWithLogisticsBot = async (history: string[], message: string): Promise<string> => {
  try {
    const ai = getClient();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are CourierOS Support, a helpful assistant for a logistics company. You help track packages and explain shipping terms. You are friendly and concise.",
      }
    });

    const result = await chat.sendMessage({ message });
    return result.text || "I didn't catch that.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "I am currently having trouble connecting to the network.";
  }
};

export const getPackagingAdvice = async (itemDescription: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `I am sending a package via courier. The contents are: "${itemDescription}". 
    Provide 3 concise bullet points on how to safely pack this item to prevent damage. 
    Also suggest if any specific label (like Fragile) is needed. Keep it under 100 words.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Ensure the item is cushioned and the box is sealed tightly.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to retrieve packaging advice at this time. Ensure the item is well padded.";
  }
};

export const optimizePricingRules = async (currentConfig: PricingConfig): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      Analyze the current courier pricing configuration and suggest optimizations for better profitability and competitiveness.
      Current Config: ${JSON.stringify(currentConfig)}
      Assumptions: Rising fuel costs, high demand for Same Day delivery.
      Output a concise suggestion (max 3 sentences) and recommended percentage adjustments.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Increase base rate by 5% to cover fuel costs.";
  } catch (error) {
    return "Market analysis unavailable.";
  }
};

export const generateNotificationTemplate = async (scenario: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Write a professional short SMS/Email notification template for a courier service customer.
    Scenario: ${scenario}.
    Use placeholders like {{customerName}}, {{orderId}}, etc. Keep it friendly but professional.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Dear {{customerName}}, there is an update on your order {{orderId}}.";
  } catch (error) {
    return "Template generation failed.";
  }
};

export const suggestStorageLocation = async (packageDetails: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      You are a Warehouse AI. Suggest a storage location (Zone A/B/C and Rack Number) based on package description.
      Rules:
      - Zone A: General Items (fast moving)
      - Zone B: Heavy/Bulky Items
      - Zone C: Fragile/High Value
      
      Package: "${packageDetails}"
      
      Output JUST the location code (e.g., "Zone A - Rack 4") and a very brief reason.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Zone A - Rack 1 (General)";
  } catch (error) {
    return "Zone A - Rack 1 (Default)";
  }
};

export const optimizeHubRouting = async (origin: string, destination: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      Optimize the route for a package going from ${origin} to ${destination}.
      Consider a hub network with Central Hub, North Regional, and South Regional.
      Output the suggested path (e.g., Origin -> Hub X -> Destination) and estimated transit time.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Direct Route suggested.";
  } catch (error) {
    return "Route optimization unavailable.";
  }
};

export const generateWeeklyBusinessForecast = async (stats?: DashboardStats): Promise<string> => {
  try {
    const ai = getClient();
    const statsContext = stats ? JSON.stringify(stats) : "No specific data provided, assume a standard mid-sized logistics company.";

    const prompt = `
      Generate a "Weekly Business Forecast & Solutions" report for a logistics company (CourierOS).
      
      Context Data:
      ${statsContext}
      
      Structure the response as follows:
      1. **Revenue Prediction**: Forecast for the upcoming week based on current trends.
      2. **Operational Risks**: Identify potential bottlenecks (e.g., high driver load, vehicle maintenance).
      3. **Recommended Solutions**: Actionable steps to mitigate risks and improve efficiency.
      4. **Strategic Focus**: One key area to focus on this week (e.g., "Customer Retention" or "Route Optimization").
      
      Keep it professional, insightful, and under 200 words.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.4,
      }
    });

    return response.text || "Unable to generate forecast.";
  } catch (error) {
    return "Weekly forecast generation failed. Please try again later.";
  }
};
