import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SPECIALTIES } from "@/lib/store";

const InputSchema = z.object({
  symptoms: z.string().trim().min(3, "اكتب الأعراض بشكل أوضح").max(1000),
});

const SPECIALTY_NAMES = SPECIALTIES.map((s) => s.name);

export interface SymptomAnalysis {
  specialty: string;          // matches one of SPECIALTY_NAMES
  confidence: number;         // 0..1
  reasoning: string;          // short Arabic explanation
  urgency: "routine" | "soon" | "urgent";
  alternatives: string[];     // up to 2 alternative specialty names
}

export const analyzeSymptoms = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<SymptomAnalysis> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const system = `أنت مساعد طبي ذكي مهمتك تحليل أعراض المريض واقتراح التخصص الطبي الأنسب له من القائمة التالية فقط:
${SPECIALTY_NAMES.map((s) => `- ${s}`).join("\n")}

قواعد صارمة:
1. يجب أن يكون "specialty" بالضبط واحداً من الأسماء أعلاه (نسخ حرفي).
2. "alternatives" تحتوي على 0 إلى 2 من نفس القائمة (لا تكرر specialty).
3. "urgency": "urgent" لو حالة طارئة (ألم صدر شديد، صعوبة تنفس، نزيف، فقدان وعي) — "soon" خلال أيام — "routine" غير عاجل.
4. "reasoning" جملة قصيرة بالعربية (≤ 25 كلمة) تشرح سبب الاختيار.
5. "confidence" رقم بين 0 و 1.
6. لا تقدّم تشخيص نهائي — فقط اقتراح تخصص للاستشارة.`;

    const tool = {
      type: "function" as const,
      function: {
        name: "suggest_specialty",
        description: "Suggest the most appropriate medical specialty for the given symptoms",
        parameters: {
          type: "object",
          properties: {
            specialty: { type: "string", enum: SPECIALTY_NAMES },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            reasoning: { type: "string" },
            urgency: { type: "string", enum: ["routine", "soon", "urgent"] },
            alternatives: {
              type: "array",
              items: { type: "string", enum: SPECIALTY_NAMES },
              maxItems: 2,
            },
          },
          required: ["specialty", "confidence", "reasoning", "urgency", "alternatives"],
          additionalProperties: false,
        },
      },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `الأعراض: ${data.symptoms}` },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "suggest_specialty" } },
      }),
    });

    if (res.status === 429) throw new Error("rate_limited");
    if (res.status === 402) throw new Error("payment_required");
    if (!res.ok) throw new Error(`ai_error_${res.status}`);

    const json = await res.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) throw new Error("no_tool_call");

    const parsed = JSON.parse(call.function.arguments) as SymptomAnalysis;
    // Safety net: ensure specialty is in the canonical list
    if (!SPECIALTY_NAMES.includes(parsed.specialty)) {
      parsed.specialty = "باطنة";
    }
    parsed.alternatives = (parsed.alternatives ?? []).filter(
      (a) => SPECIALTY_NAMES.includes(a) && a !== parsed.specialty
    );
    return parsed;
  });
