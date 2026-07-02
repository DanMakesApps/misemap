import { NextResponse } from "next/server";

const allowedLanes = ["Prep", "Hob", "Oven", "Passive", "Serve"] as const;

const recipeSchema = {
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

function friendlyError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return friendlyError(
      "OpenAI API key is missing. Add OPENAI_API_KEY to your local environment.",
      500,
    );
  }

  let image: unknown;

  try {
    const body = (await request.json()) as { image?: unknown };
    image = body.image;
  } catch {
    return friendlyError("The recipe image could not be read. Please try again.");
  }

  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    return friendlyError("Please upload a valid recipe image.");
  }

  try {
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
            content:
              "You extract cooking timelines from recipe photos. Return only structured data matching the schema. Include ingredient amounts in task instructions where useful. Estimate missing timings conservatively and list assumptions or uncertainties.",
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "Extract this recipe into a MiseMap cooking timeline. Use lanes Prep, Hob, Oven, Passive, or Serve. Include recipe title, servings, ingredients with amounts, ordered tasks, estimated durations, active/passive status, startMinute and durationMinutes where possible, plus assumptions and uncertainties.",
              },
              { type: "input_image", image_url: image },
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

    if (!response.ok) {
      return friendlyError(
        "OpenAI could not extract the recipe from this image. Please try a clearer photo.",
      );
    }

    const data = (await response.json()) as {
      output_text?: string;
      output?: Array<{
        content?: Array<{
          type?: string;
          text?: string;
        }>;
      }>;
    };
    const outputText =
      data.output_text ??
      data.output
        ?.flatMap((item) => item.content ?? [])
        .find((item) => item.type === "output_text" && item.text)?.text;

    if (!outputText) {
      return friendlyError(
        "OpenAI returned an empty extraction. Please try another photo.",
      );
    }

    return NextResponse.json({ recipe: JSON.parse(outputText) });
  } catch (error) {
    console.error("Recipe extraction failed", error);
    return friendlyError(
      "Something went wrong while extracting the recipe. Please try again.",
    );
  }
}
