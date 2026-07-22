import { NextResponse } from "next/server";

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

function getMetaContent(html: string, name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const metaPattern = new RegExp(
    `<meta\\s+[^>]*(?:property|name)=["']${escapedName}["'][^>]*>`,
    "i",
  );
  const contentPattern = /content=["']([^"']+)["']/i;
  const match = html.match(metaPattern);

  if (!match) {
    return "";
  }

  return stripTags(match[0].match(contentPattern)?.[1] ?? "");
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

function isRecipeType(value: JsonLdValue | undefined) {
  if (typeof value === "string") {
    return value.toLowerCase().includes("recipe");
  }

  if (Array.isArray(value)) {
    return value.some(isRecipeType);
  }

  return false;
}

function getJsonLdImage(value: JsonLdValue | undefined): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const image = getJsonLdImage(item);

      if (image) {
        return image;
      }
    }
  }

  if (value && typeof value === "object") {
    const object = value as JsonLdObject;

    return getJsonLdImage(object.url) || getJsonLdImage(object["@id"]);
  }

  return "";
}

function extractJsonLdRecipeImage(html: string) {
  const scriptMatches = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const match of scriptMatches) {
    try {
      const parsed = JSON.parse(decodeHtmlEntities(match[1].trim())) as JsonLdValue;
      const recipe = collectJsonLdObjects(parsed).find((item) =>
        isRecipeType(item["@type"]),
      );
      const image = getJsonLdImage(recipe?.image);

      if (image) {
        return image;
      }
    } catch {
      continue;
    }
  }

  return "";
}

function resolveUrl(value: string, baseUrl: URL) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
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
        "User-Agent": "MiseMap prototype recipe preview",
      },
    });

    if (!pageResponse.ok) {
      return friendlyError("MiseMap could not preview that recipe page.", 502);
    }

    const html = await pageResponse.text();
    const title =
      getMetaContent(html, "og:title") ||
      getMetaContent(html, "twitter:title") ||
      stripTags(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
    const siteName = getMetaContent(html, "og:site_name") || recipeUrl.hostname;
    const imageUrl = resolveUrl(
      getMetaContent(html, "og:image") ||
        getMetaContent(html, "twitter:image") ||
        extractJsonLdRecipeImage(html),
      recipeUrl,
    );

    return NextResponse.json({
      title,
      siteName,
      imageUrl,
    });
  } catch {
    return friendlyError("MiseMap could not preview that recipe page.", 502);
  }
}
