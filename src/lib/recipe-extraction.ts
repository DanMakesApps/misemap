const allowedLanes = ["Prep", "Hob", "Oven", "Passive", "Serve"] as const;
const extractionDetailLevel = "Standard";

export const recipeSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "servings",
    "ingredients",
    "tasks",
    "assumptions",
    "uncertainties",
  ],
  properties: {
    title: { type: "string" },
    servings: { type: ["number", "null"] },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "amount"],
        properties: {
          name: { type: "string" },
          amount: { type: "string" },
        },
      },
    },
    tasks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "lane",
          "startMinute",
          "durationMinutes",
          "instruction",
          "shortLabel",
          "workMode",
          "track",
        ],
        properties: {
          id: { type: "number" },
          lane: { type: "string", enum: allowedLanes },
          startMinute: { type: "number" },
          durationMinutes: { type: "number" },
          instruction: { type: "string" },
          shortLabel: { type: "string" },
          workMode: { type: "string", enum: ["Active", "Passive"] },
          track: { type: ["number", "null"] },
        },
      },
    },
    assumptions: { type: "array", items: { type: "string" } },
    uncertainties: { type: "array", items: { type: "string" } },
  },
};

type OpenAIContent =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

export function getRecipeTimelinePrompt(sourceDescription: string) {
  return [
    `Extract this recipe from ${sourceDescription} into a MiseMap cooking timeline.`,
    `Detail level: ${extractionDetailLevel}.`,
    "Use lanes Prep, Hob, Oven, Passive, or Serve.",
    "Do not classify brushing, coating, dressing, or assembling as Hob unless the task actually uses a stovetop pan or pot.",
    "Include recipe title, servings, ingredients with amounts, ordered tasks, estimated durations, active/passive status, startMinute and durationMinutes where possible, plus assumptions and uncertainties.",
    "Put ingredient amounts directly into each full task instruction whenever the amount is visible or can be safely inferred from the ingredient list.",
    "If a later instruction uses a prepared ingredient that has not been prepared yet, add an earlier Prep task for it. For example, if serving uses 'thinly sliced spring onion', add a task such as 'Thinly slice 1 spring onion' before the garnish task, ideally during a passive cooking window.",
    "Keep the timeline practical: split meaningful prerequisite prep, but merge tiny actions when they happen immediately together and do not affect readiness.",
  ].join(" ");
}

function getSystemPrompt() {
  return [
    "You extract cooking timelines from recipe sources.",
    `Use the ${extractionDetailLevel} detail level: create a practical cook-along timeline that is detailed enough to prevent hidden prep surprises, without splitting every tiny motion into its own task.`,
    "Return only structured data matching the schema.",
    "Full task instructions must include visible ingredient amounts where possible, such as 'Chop 1 onion' rather than 'Chop onion'.",
    "Decompose compound instructions into prerequisite prep tasks when an ingredient is first described as prepared at the point of use, such as chopped, sliced, grated, toasted, peeled, drained, washed, or cooked.",
    "Schedule small prerequisite prep tasks during passive windows where possible, for example while something bakes, simmers, rests, boils, marinates, or preheats.",
    "Do not hide required prep inside a final garnish or serving step if the ingredient needs slicing, chopping, grating, or similar preparation first.",
    "Classify lanes by equipment and action: Prep is for chopping, slicing, mixing, coating, brushing, transferring, draining, assembling, and adding toppings before cooking. Hob is only for stovetop work using a hob, burner, saucepan, frying pan, skillet, or pot. Oven is for baking, roasting, grilling, broiling, or preheating. Serve is only for final plating, garnishing, and serving. Passive is for waiting or resting when no specific equipment lane is more useful.",
    "Estimate missing timings conservatively and list assumptions or uncertainties.",
  ].join(" ");
}

export function getOpenAIOutputText(data: OpenAIResponse) {
  return (
    data.output_text ??
    data.output
      ?.flatMap((item) => item.content ?? [])
      .find((item) => item.type === "output_text" && item.text)?.text
  );
}

export async function extractRecipeWithOpenAI({
  apiKey,
  sourceDescription,
  userContent,
}: {
  apiKey: string;
  sourceDescription: string;
  userContent: OpenAIContent[];
}) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: getSystemPrompt(),
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: getRecipeTimelinePrompt(sourceDescription),
            },
            ...userContent,
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "recipe_timeline_extraction",
          strict: true,
          schema: recipeSchema,
        },
      },
    }),
  });

  return {
    ok: response.ok,
    status: response.status,
    data: (await response.json()) as OpenAIResponse,
  };
}
