import { NextResponse } from "next/server";

import {
  extractRecipeWithOpenAI,
  getOpenAIOutputText,
} from "@/lib/recipe-extraction";

const maxRecipeTextLength = 20000;

type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue };

type JsonLdObject = { [key: string]: JsonLdValue };

function friendlyError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&frac12;/g, "1/2")
    .replace(/&frac14;/g, "1/4")
    .replace(/&frac34;/g, "3/4")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number(code)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCharCode(parseInt(code, 16)),
    );
}

function stripTags(value: string) {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function getString(value: JsonLdValue | undefined) {
  return typeof value === "string" ? stripTags(value) : "";
}

function getStringList(value: JsonLdValue | undefined) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return stripTags(item);
      }

      if (item && typeof item === "object" && !Array.isArray(item)) {
        return getString(item.text) || getString(item.name);
      }

      return "";
    })
    .filter(Boolean);
}

function isRecipeType(value: JsonLdValue | undefined) {
  if (typeof value === "string") {
    return value.toLowerCase().includes("recipe");
  }

  if (Array.isArray(value)) {
    return value.some(isRecipeType);
  }

  return false;
}

function collectJsonLdObjects(value: JsonLdValue, objects: JsonLdObject[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectJsonLdObjects(item, objects));
    return objects;
  }

  if (!value || typeof value !== "object") {
    return objects;
  }

  objects.push(value);

  Object.values(value).forEach((item) => collectJsonLdObjects(item, objects));
  return objects;
}

function extractJsonLdRecipe(html: string) {
  const scriptMatches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const match of scriptMatches) {
    try {
      const parsed = JSON.parse(decodeHtmlEntities(match[1].trim())) as JsonLdValue;
      const recipe = collectJsonLdObjects(parsed).find((item) =>
        isRecipeType(item["@type"]),
      );

      if (!recipe) {
        continue;
      }

      const ingredients = getStringList(recipe.recipeIngredient);
      const instructions = getStringList(recipe.recipeInstructions);

      if (ingredients.length === 0 || instructions.length === 0) {
        continue;
      }

      return [
        `Title: ${getString(recipe.name)}`,
        `Servings: ${getString(recipe.recipeYield)}`,
        `Prep time: ${getString(recipe.prepTime)}`,
        `Cook time: ${getString(recipe.cookTime)}`,
        `Total time: ${getString(recipe.totalTime)}`,
        "Ingredients:",
        ...ingredients.map((ingredient) => `- ${ingredient}`),
        "Instructions:",
        ...instructions.map((instruction, index) => `${index + 1}. ${instruction}`),
      ]
        .filter((line) => !line.endsWith(": "))
        .join("\n");
    } catch {
      continue;
    }
  }

  return "";
}

function htmlToText(html: string) {
  return stripTags(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(h1|h2|h3|p|li|ol|ul|div|section)>/gi, "\n"),
  );
}

function extractFallbackRecipeText(html: string) {
  const text = htmlToText(html);
  const ingredientsIndex = text.search(/\bIngredients\b/i);
  const instructionsIndex = text.search(/\b(Instructions|Method|Directions)\b/i);

  if (ingredientsIndex === -1 || instructionsIndex === -1) {
    return text.slice(0, maxRecipeTextLength);
  }

  const start = Math.max(0, Math.min(ingredientsIndex, instructionsIndex) - 1000);
  const endCandidates = [
    text.search(/\bNotes\b/i),
    text.search(/\bNutrition\b/i),
    text.search(/\bDid you make this recipe\b/i),
    text.search(/\bComments\b/i),
  ].filter((index) => index > instructionsIndex);
  const end =
    endCandidates.length > 0 ? Math.min(...endCandidates) : instructionsIndex + 12000;

  return text.slice(start, end).slice(0, maxRecipeTextLength);
}

function extractRecipeText(html: string) {
  return (extractJsonLdRecipe(html) || extractFallbackRecipeText(html)).trim();
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return friendlyError(
      "OpenAI API key is missing. Add OPENAI_API_KEY to your local environment.",
      500,
    );
  }

  let recipeUrl: URL;

  try {
    const body = (await request.json()) as { url?: unknown };

    if (typeof body.url !== "string") {
      return friendlyError("Please enter a recipe link.");
    }

    recipeUrl = new URL(body.url);
  } catch {
    return friendlyError("Please enter a valid recipe link.");
  }

  if (!["http:", "https:"].includes(recipeUrl.protocol)) {
    return friendlyError("Recipe links must start with http:// or https://.");
  }

  try {
    const pageResponse = await fetch(recipeUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "MiseMap prototype recipe importer",
      },
    });

    if (!pageResponse.ok) {
      return friendlyError(
        "MiseMap could not read that recipe page. Please try another link.",
      );
    }

    const html = await pageResponse.text();
    const recipeText = extractRecipeText(html);

    if (!recipeText) {
      return friendlyError(
        "MiseMap could not find recipe details on that page. Please try another link.",
      );
    }

    const response = await extractRecipeWithOpenAI({
      apiKey,
      sourceDescription: "the cleaned recipe text from the submitted web link",
      userContent: [
        {
          type: "input_text",
          text: [
            `Source URL: ${recipeUrl.toString()}`,
            "Cleaned recipe text:",
            recipeText.slice(0, maxRecipeTextLength),
          ].join("\n\n"),
        },
      ],
    });

    if (!response.ok) {
      return friendlyError(
        "OpenAI could not turn that recipe page into a timeline. Please try another link.",
      );
    }

    const outputText = getOpenAIOutputText(response.data);

    if (!outputText) {
      return friendlyError(
        "OpenAI returned an empty extraction. Please try another link.",
      );
    }

    return NextResponse.json({ recipe: JSON.parse(outputText) });
  } catch (error) {
    console.error("Recipe link extraction failed", error);
    return friendlyError(
      "Something went wrong while importing that recipe link. Please try again.",
    );
  }
}
