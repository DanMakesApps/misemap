import { NextResponse } from "next/server";

import {
  extractRecipeWithOpenAI,
  getOpenAIOutputText,
} from "@/lib/recipe-extraction";

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

  let images: unknown[];

  try {
    const body = (await request.json()) as {
      image?: unknown;
      images?: unknown;
    };
    images = Array.isArray(body.images) ? body.images : [body.image];
  } catch {
    return friendlyError("The recipe images could not be read. Please try again.");
  }

  const validImages = images.filter(
    (image): image is string =>
      typeof image === "string" && image.startsWith("data:image/"),
  );

  if (validImages.length === 0) {
    return friendlyError("Please upload at least one valid recipe image.");
  }

  try {
    const response = await extractRecipeWithOpenAI({
      apiKey,
      sourceDescription: "the uploaded recipe photos",
      userContent: validImages.map((image) => ({
        type: "input_image",
        image_url: image,
      })),
    });

    if (!response.ok) {
      return friendlyError(
        "OpenAI could not extract the recipe from this image. Please try a clearer photo.",
      );
    }

    const outputText = getOpenAIOutputText(response.data);

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
