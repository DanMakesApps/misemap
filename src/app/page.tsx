"use client";

import type { ChangeEvent } from "react";
import { useState } from "react";

type Lane = "Prep" | "Hob" | "Oven" | "Passive" | "Serve";
type WorkMode = "Active" | "Passive";

type TimelineTask = {
  id: number;
  lane: Lane;
  startMinute: number;
  durationMinutes: number;
  instruction: string;
  shortLabel: string;
  workMode: WorkMode;
  track?: number | null;
};

type Ingredient = {
  name: string;
  amount: string;
};

type RecipeData = {
  title: string;
  servings: number | null;
  ingredients: Ingredient[];
  tasks: TimelineTask[];
  assumptions: string[];
  uncertainties: string[];
};

type UploadedImage = {
  id: string;
  name: string;
  previewUrl: string;
};

type ExtractRecipeResponse = {
  recipe?: RecipeData;
  error?: string;
};

const currentMinute = 18;
const totalMinutes = 60;
const lanes: Lane[] = ["Prep", "Hob", "Oven", "Passive", "Serve"];
const minuteMarkers = [0, 15, 30, 45, 60];

const tasks: TimelineTask[] = [
  {
    id: 1,
    lane: "Oven",
    startMinute: 0,
    durationMinutes: 10,
    instruction: "Preheat oven to 180\u00b0C",
    shortLabel: "Preheat",
    workMode: "Passive",
  },
  {
    id: 2,
    lane: "Prep",
    startMinute: 0,
    durationMinutes: 8,
    instruction: "Chop 1 onion, 2 garlic cloves, and 1 carrot",
    shortLabel: "Chop veg",
    workMode: "Active",
  },
  {
    id: 3,
    lane: "Hob",
    startMinute: 0,
    durationMinutes: 12,
    instruction: "Bring salted water to the boil for 300g pasta",
    shortLabel: "Boil water",
    workMode: "Passive",
  },
  {
    id: 4,
    lane: "Hob",
    startMinute: 8,
    durationMinutes: 6,
    instruction: "Saut\u00e9 1 chopped onion and 1 chopped carrot",
    shortLabel: "Saut\u00e9 veg",
    workMode: "Active",
    track: 1,
  },
  {
    id: 5,
    lane: "Hob",
    startMinute: 14,
    durationMinutes: 1,
    instruction: "Add 2 chopped garlic cloves",
    shortLabel: "Garlic",
    workMode: "Active",
    track: 1,
  },
  {
    id: 6,
    lane: "Hob",
    startMinute: 15,
    durationMinutes: 18,
    instruction: "Simmer 500g tomato sauce",
    shortLabel: "Simmer sauce",
    workMode: "Passive",
  },
  {
    id: 7,
    lane: "Hob",
    startMinute: 20,
    durationMinutes: 10,
    instruction: "Cook 300g pasta",
    shortLabel: "Cook pasta",
    workMode: "Active",
    track: 1,
  },
  {
    id: 8,
    lane: "Prep",
    startMinute: 30,
    durationMinutes: 5,
    instruction: "Drain 300g pasta and mix with 500g tomato sauce",
    shortLabel: "Mix pasta",
    workMode: "Active",
  },
  {
    id: 9,
    lane: "Prep",
    startMinute: 35,
    durationMinutes: 3,
    instruction: "Transfer pasta to baking dish and add 100g cheese",
    shortLabel: "Add cheese",
    workMode: "Active",
  },
  {
    id: 10,
    lane: "Oven",
    startMinute: 38,
    durationMinutes: 15,
    instruction: "Bake pasta with 100g cheese",
    shortLabel: "Bake",
    workMode: "Passive",
  },
  {
    id: 11,
    lane: "Passive",
    startMinute: 53,
    durationMinutes: 5,
    instruction: "Rest",
    shortLabel: "Rest",
    workMode: "Passive",
  },
  {
    id: 12,
    lane: "Serve",
    startMinute: 58,
    durationMinutes: 2,
    instruction: "Add fresh herbs to serve",
    shortLabel: "Serve",
    workMode: "Active",
  },
];

const sampleRecipe: RecipeData = {
  title: "Tomato Pasta Bake",
  servings: 4,
  ingredients: [
    { name: "Pasta", amount: "300g" },
    { name: "Onion", amount: "1" },
    { name: "Garlic", amount: "2 cloves" },
    { name: "Carrot", amount: "1" },
    { name: "Tomato sauce", amount: "500g" },
    { name: "Cheese", amount: "100g" },
    { name: "Fresh herbs", amount: "to serve" },
  ],
  tasks,
  assumptions: ["Sample data used when no recipe has been extracted yet."],
  uncertainties: [],
};

const laneStyles: Record<Lane, string> = {
  Prep: "bg-[#2f6f4e] text-white",
  Hob: "bg-[#b85428] text-white",
  Oven: "bg-[#7b4f9d] text-white",
  Passive: "bg-[#6b7280] text-white",
  Serve: "bg-[#1f6f8b] text-white",
};

const laneLegend = [
  { label: "Prep", className: laneStyles.Prep },
  { label: "Hob", className: laneStyles.Hob },
  { label: "Oven", className: laneStyles.Oven },
  { label: "Passive", className: laneStyles.Passive },
  { label: "Serve", className: laneStyles.Serve },
];

function getActiveTasks(recipeTasks: TimelineTask[]) {
  return recipeTasks.filter(
    (task) =>
      task.startMinute <= currentMinute &&
      currentMinute < task.startMinute + task.durationMinutes,
  );
}

function getUpcomingTasks(recipeTasks: TimelineTask[]) {
  return recipeTasks
    .filter((task) => task.startMinute >= currentMinute)
    .sort(
      (a, b) =>
        a.startMinute - b.startMinute || a.durationMinutes - b.durationMinutes,
    );
}

function getCompletedTasks(recipeTasks: TimelineTask[]) {
  return recipeTasks
    .filter((task) => currentMinute >= task.startMinute + task.durationMinutes)
    .sort(
      (a, b) =>
        a.startMinute - b.startMinute || a.durationMinutes - b.durationMinutes,
    );
}

function normalizeExtractedRecipe(recipe: RecipeData): RecipeData {
  const normalizedTasks: TimelineTask[] = (recipe.tasks ?? []).map((task, index) => ({
    ...task,
    id: task.id || index + 1,
    startMinute: Math.max(0, Math.round(task.startMinute ?? 0)),
    durationMinutes: Math.max(1, Math.round(task.durationMinutes ?? 1)),
    shortLabel: task.shortLabel || task.instruction || `Task ${index + 1}`,
    instruction: task.instruction || task.shortLabel || `Task ${index + 1}`,
    workMode: task.workMode === "Passive" ? "Passive" : "Active",
    track: typeof task.track === "number" ? task.track : null,
  }));

  return {
    ...recipe,
    title: recipe.title || "Extracted recipe",
    ingredients: recipe.ingredients ?? [],
    assumptions:
      normalizedTasks.length > 0
        ? (recipe.assumptions ?? [])
        : [
            ...(recipe.assumptions ?? []),
            "No usable timeline tasks were returned, so the sample timeline is shown.",
          ],
    uncertainties: recipe.uncertainties ?? [],
    tasks: normalizedTasks.length > 0 ? normalizedTasks : sampleRecipe.tasks,
  };
}

function formatMinuteRange(task: TimelineTask) {
  return `${task.startMinute}-${task.startMinute + task.durationMinutes} min`;
}

function getTaskWidth(task: TimelineTask) {
  return `${(task.durationMinutes / totalMinutes) * 100}%`;
}

function getTaskLeft(task: TimelineTask) {
  return `${(task.startMinute / totalMinutes) * 100}%`;
}

function getLanePositionedTasks(recipeTasks: TimelineTask[], lane: Lane) {
  const trackEnds: number[] = [];

  return recipeTasks
    .filter((task) => task.lane === lane)
    .sort(
      (a, b) =>
        a.startMinute - b.startMinute || a.durationMinutes - b.durationMinutes,
    )
    .map((task) => {
      const availableTrack = trackEnds.findIndex(
        (endMinute) => task.startMinute >= endMinute + 1,
      );
      const visualTrack =
        typeof task.track === "number" && task.track >= 0
          ? task.track
          : availableTrack === -1
            ? trackEnds.length
            : availableTrack;

      trackEnds[visualTrack] = task.startMinute + task.durationMinutes;

      return { ...task, visualTrack };
    });
}

function getLaneHeight(laneTasks: Array<TimelineTask & { visualTrack: number }>) {
  const maxTrack = Math.max(0, ...laneTasks.map((task) => task.visualTrack));

  return `${4.75 + maxTrack * 2.75}rem`;
}

function getTaskStatus(task: TimelineTask) {
  const endMinute = task.startMinute + task.durationMinutes;

  if (task.startMinute <= currentMinute && currentMinute < endMinute) {
    return "Active now";
  }

  if (currentMinute >= endMinute) {
    return "Done";
  }

  return "Later";
}

function getExpandedBlockLabel(task: TimelineTask) {
  return `${task.id} ${task.shortLabel}`;
}

function TaskSummary({
  task,
  selected,
  onSelect,
}: {
  task: TimelineTask;
  selected: boolean;
  onSelect: (taskId: number) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(task.id)}
        className={`w-full rounded-md border px-3 py-2 text-left transition ${
          selected
            ? "border-[#2f6f4e] bg-[#eef7f0]"
            : "border-[#ddcdb9] bg-white hover:border-[#bda98d]"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[#211b16]">
            {task.id}. {task.shortLabel}
          </span>
          <span className="shrink-0 text-xs font-medium text-[#8a5a22]">
            {formatMinuteRange(task)}
          </span>
        </div>
        <p className="mt-1 text-xs text-[#6d5e51]">{task.lane}</p>
      </button>
    </li>
  );
}

function readImageFiles(files: File[]) {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<UploadedImage>((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve({
                id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
                name: file.name,
                previewUrl: reader.result,
              });
              return;
            }

            reject(new Error("Image could not be read."));
          };

          reader.onerror = () => reject(new Error("Image could not be read."));
          reader.readAsDataURL(file);
        }),
    ),
  );
}

function MultiImageUploadCard({
  id,
  title,
  description,
  images,
  onImagesAdd,
  onImageRemove,
}: {
  id: string;
  title: string;
  description: string;
  images: UploadedImage[];
  onImagesAdd: (images: UploadedImage[]) => void;
  onImageRemove: (imageId: string) => void;
}) {
  const [pasteError, setPasteError] = useState<string | null>(null);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length === 0) {
      return;
    }

    onImagesAdd(await readImageFiles(files));
    event.target.value = "";
  }

  async function handlePasteFromClipboard() {
    setPasteError(null);

    if (!navigator.clipboard?.read) {
      setPasteError("Clipboard image paste is not available in this browser.");
      return;
    }

    try {
      const items = await navigator.clipboard.read();
      const files: File[] = [];

      for (const item of items) {
        const imageType = item.types.find((type) => type.startsWith("image/"));

        if (!imageType) {
          continue;
        }

        const blob = await item.getType(imageType);
        files.push(
          new File([blob], `Pasted recipe image ${images.length + files.length + 1}`, {
            type: imageType,
          }),
        );
      }

      if (files.length === 0) {
        setPasteError("No image was found on the clipboard.");
        return;
      }

      onImagesAdd(await readImageFiles(files));
    } catch {
      setPasteError("MiseMap could not read an image from the clipboard.");
    }
  }

  return (
    <div className="rounded-lg border border-[#ddcdb9] bg-white p-5">
      <div className="flex min-h-full flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-[#6d5e51]">{description}</p>
        </div>

        <label
          htmlFor={id}
          className="flex min-h-48 cursor-pointer items-center justify-center rounded-md border border-dashed border-[#cbb79d] bg-[#fffaf3] text-center transition hover:border-[#8a5a22]"
        >
          <span className="px-6 text-sm font-medium text-[#6d5e51]">
            Select one or more images
          </span>
        </label>

        <input
          id={id}
          type="file"
          accept="image/*"
          multiple
          onChange={handleChange}
          className="sr-only"
        />

        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor={id}
            className="cursor-pointer rounded-md border border-[#ddcdb9] px-3 py-2 text-sm font-semibold text-[#3e342d] transition hover:border-[#8a5a22]"
          >
            Choose files
          </label>
          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="rounded-md border border-[#ddcdb9] px-3 py-2 text-sm font-semibold text-[#3e342d] transition hover:border-[#8a5a22] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2"
          >
            Paste
          </button>
          <p className="text-sm text-[#6d5e51]">
            {images.length === 0
              ? "No recipe images added"
              : `${images.length} recipe image${images.length === 1 ? "" : "s"} added`}
          </p>
        </div>

        {pasteError ? (
          <p className="text-sm font-medium text-[#a33b24]">{pasteError}</p>
        ) : null}

        {images.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {images.map((image) => (
              <li
                key={image.id}
                className="overflow-hidden rounded-md border border-[#ddcdb9] bg-[#fffaf3]"
              >
                <span
                  role="img"
                  aria-label={`${image.name} preview`}
                  className="block h-36 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${image.previewUrl})` }}
                />
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                  <p className="min-w-0 truncate text-sm text-[#6d5e51]">
                    {image.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => onImageRemove(image.id)}
                    className="shrink-0 rounded-md border border-[#ddcdb9] px-2 py-1 text-xs font-semibold text-[#3e342d] transition hover:border-[#8a5a22] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function ImageUploadCard({
  id,
  title,
  description,
  image,
  onImageChange,
}: {
  id: string;
  title: string;
  description: string;
  image: UploadedImage | null;
  onImageChange: (image: UploadedImage | null) => void;
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      onImageChange(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onImageChange({
          id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          name: file.name,
          previewUrl: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-lg border border-[#ddcdb9] bg-white p-5">
      <div className="flex min-h-full flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-[#6d5e51]">{description}</p>
        </div>

        <label
          htmlFor={id}
          className="flex min-h-48 cursor-pointer items-center justify-center rounded-md border border-dashed border-[#cbb79d] bg-[#fffaf3] text-center transition hover:border-[#8a5a22]"
        >
          {image ? (
            <span
              role="img"
              aria-label={`${title} preview`}
              className="block h-48 w-full rounded-md bg-cover bg-center"
              style={{ backgroundImage: `url(${image.previewUrl})` }}
            />
          ) : (
            <span className="px-6 text-sm font-medium text-[#6d5e51]">
              Select image
            </span>
          )}
        </label>

        <input
          id={id}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="sr-only"
        />

        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-sm text-[#6d5e51]">
            {image ? image.name : "No image selected"}
          </p>
          <label
            htmlFor={id}
            className="shrink-0 cursor-pointer rounded-md border border-[#ddcdb9] px-3 py-2 text-sm font-semibold text-[#3e342d] transition hover:border-[#8a5a22]"
          >
            Choose
          </label>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [recipeImages, setRecipeImages] = useState<UploadedImage[]>([]);
  const [dishImage, setDishImage] = useState<UploadedImage | null>(null);
  const [recipeUrl, setRecipeUrl] = useState("");
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const activeRecipe = recipe ?? sampleRecipe;
  const allTasks = [...activeRecipe.tasks].sort(
    (a, b) =>
      a.startMinute - b.startMinute || a.durationMinutes - b.durationMinutes,
  );
  const completedTasks = getCompletedTasks(activeRecipe.tasks);
  const activeTasks = getActiveTasks(activeRecipe.tasks);
  const upcomingTasks = getUpcomingTasks(activeRecipe.tasks);
  const nextTask = upcomingTasks[0];
  const laterTasks = upcomingTasks.slice(1);
  const [selectedTaskId, setSelectedTaskId] = useState(activeTasks[0].id);
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const selectedTask =
    activeRecipe.tasks.find((task) => task.id === selectedTaskId) ??
    activeTasks[0] ??
    activeRecipe.tasks[0];
  const expandedTaskId = hoveredTaskId;
  const canExtractPhoto = recipeImages.length > 0 && !extracting;
  const canExtractLink = Boolean(recipeUrl.trim() && !extracting);

  function handleRecipeImagesAdd(images: UploadedImage[]) {
    setRecipeImages((currentImages) => [...currentImages, ...images]);
    setRecipe(null);
    setExtractError(null);
  }

  function handleRecipeImageRemove(imageId: string) {
    setRecipeImages((currentImages) =>
      currentImages.filter((image) => image.id !== imageId),
    );
    setRecipe(null);
    setExtractError(null);
  }

  function handleDishImageChange(image: UploadedImage | null) {
    setDishImage(image);
  }

  async function handleExtractRecipe() {
    if (!canExtractPhoto) {
      return;
    }

    setExtracting(true);
    setExtractError(null);

    try {
      const response = await fetch("/api/extract-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: recipeImages.map((image) => image.previewUrl),
        }),
      });
      const payload = (await response.json()) as ExtractRecipeResponse;

      if (!response.ok || !payload.recipe) {
        throw new Error(
          payload.error ??
            "Sorry, the recipe could not be extracted. Please try another photo.",
        );
      }

      const extractedRecipe = normalizeExtractedRecipe(payload.recipe);
      const firstSelectedTask =
        getActiveTasks(extractedRecipe.tasks)[0] ?? extractedRecipe.tasks[0];

      setRecipe(extractedRecipe);
      if (firstSelectedTask) {
        setSelectedTaskId(firstSelectedTask.id);
      }
    } catch (error) {
      setRecipe(null);
      setExtractError(
        error instanceof Error
          ? error.message
          : "Sorry, the recipe could not be extracted. Please try another photo.",
      );
    } finally {
      setExtracting(false);
    }
  }

  async function handleExtractRecipeLink() {
    if (!canExtractLink) {
      return;
    }

    setExtracting(true);
    setExtractError(null);

    try {
      const response = await fetch("/api/extract-recipe-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: recipeUrl.trim() }),
      });
      const payload = (await response.json()) as ExtractRecipeResponse;

      if (!response.ok || !payload.recipe) {
        throw new Error(
          payload.error ??
            "Sorry, that recipe link could not be imported. Please try another link.",
        );
      }

      const extractedRecipe = normalizeExtractedRecipe(payload.recipe);
      const firstSelectedTask =
        getActiveTasks(extractedRecipe.tasks)[0] ?? extractedRecipe.tasks[0];

      setRecipe(extractedRecipe);
      if (firstSelectedTask) {
        setSelectedTaskId(firstSelectedTask.id);
      }
    } catch (error) {
      setRecipe(null);
      setExtractError(
        error instanceof Error
          ? error.message
          : "Sorry, that recipe link could not be imported. Please try another link.",
      );
    } finally {
      setExtracting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf3] text-[#211b16]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-8 sm:px-10 lg:px-12">
        <header className="flex flex-col gap-6 border-b border-[#e5d6c3] pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-[#8a5a22]">
              MiseMap
            </p>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
              MiseMap
            </h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-[#5f5146]">
              Turn recipes into cooking timelines
            </p>
          </div>
          <p className="rounded-md border border-[#ddcdb9] bg-white px-4 py-3 text-sm font-medium text-[#6d5e51]">
            Local prototype only
          </p>
        </header>

        <section aria-labelledby="upload-recipe" className="space-y-5">
          <div>
            <h2
              id="upload-recipe"
              className="text-2xl font-semibold tracking-tight"
            >
              Add recipe source
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-[#6d5e51]">
              Upload a recipe photo or paste a recipe link. The finished dish
              photo stays preview-only for now.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <MultiImageUploadCard
              id="recipe-photo"
              title="Recipe / instructions / ingredients"
              description="Add one or more photos or pasted screengrabs of the written recipe, ingredients, or cooking instructions."
              images={recipeImages}
              onImagesAdd={handleRecipeImagesAdd}
              onImageRemove={handleRecipeImageRemove}
            />
            <ImageUploadCard
              id="dish-photo"
              title="Finished dish"
              description="Photo of the dish you are aiming to cook."
              image={dishImage}
              onImageChange={handleDishImageChange}
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-[#ddcdb9] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#211b16]">
                Extract from photo
              </p>
              <p className="mt-1 text-sm text-[#6d5e51]">
                The recipe photo is sent to a local API route, which calls
                OpenAI. Nothing is permanently stored.
              </p>
              {extractError ? (
                <p className="mt-2 text-sm font-medium text-[#a33b24]">
                  {extractError}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleExtractRecipe}
              disabled={!canExtractPhoto}
              className="inline-flex h-12 w-fit items-center justify-center rounded-md bg-[#2f6f4e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#285f43] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-[#9ca99f]"
            >
              {extracting ? "Extracting..." : "Extract from photo"}
            </button>
          </div>

          <div className="rounded-lg border border-[#ddcdb9] bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="recipe-url"
                  className="font-semibold text-[#211b16]"
                >
                  Import from recipe link
                </label>
                <p className="mt-1 text-sm text-[#6d5e51]">
                  MiseMap reads the page server-side, keeps the likely recipe
                  card text, then asks OpenAI to create the same timeline data.
                </p>
                <input
                  id="recipe-url"
                  type="url"
                  value={recipeUrl}
                  onChange={(event) => {
                    setRecipeUrl(event.target.value);
                    setExtractError(null);
                  }}
                  placeholder="https://example.com/recipe"
                  className="mt-3 h-12 w-full rounded-md border border-[#ddcdb9] bg-[#fffaf3] px-3 text-sm text-[#211b16] outline-none transition placeholder:text-[#9a8c7f] focus:border-[#2f6f4e] focus:ring-2 focus:ring-[#2f6f4e]/20"
                />
              </div>
              <button
                type="button"
                onClick={handleExtractRecipeLink}
                disabled={!canExtractLink}
                className="inline-flex h-12 w-fit items-center justify-center rounded-md bg-[#2f6f4e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#285f43] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-[#9ca99f]"
              >
                {extracting ? "Importing..." : "Import link"}
              </button>
            </div>
          </div>
        </section>

        {recipe ? (
        <section aria-labelledby="sample-timeline" className="space-y-6">
          <div>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="sample-timeline"
                  className="text-2xl font-semibold tracking-tight"
                >
                  Sample timeline
                </h2>
                <p className="mt-1 text-sm text-[#6d5e51]">
                  {activeRecipe.title}
                  {activeRecipe.servings
                    ? `, ${activeRecipe.servings} servings`
                    : ""}
                  , 60 minutes
                </p>
              </div>
              <p className="text-sm font-medium text-[#8a5a22]">
                Current minute: {currentMinute}
              </p>
            </div>

            <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <div className="rounded-lg border border-[#ddcdb9] bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                  Ingredients
                </h3>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {activeRecipe.ingredients.map((ingredient) => (
                    <li
                      key={`${ingredient.amount}-${ingredient.name}`}
                      className="rounded-md bg-[#f8efe3] px-3 py-2 text-sm text-[#3e342d]"
                    >
                      <span className="font-semibold">
                        {ingredient.amount}
                      </span>{" "}
                      {ingredient.name}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-[#ddcdb9] bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                  Extraction notes
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-[#6d5e51]">
                  {[
                    ...activeRecipe.assumptions,
                    ...activeRecipe.uncertainties,
                  ].map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                  {activeRecipe.assumptions.length === 0 &&
                  activeRecipe.uncertainties.length === 0 ? (
                    <li>No assumptions or uncertainties returned.</li>
                  ) : null}
                </ul>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {laneLegend.map((item) => (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-md border border-[#ddcdb9] bg-white px-3 py-2 text-sm font-medium text-[#3e342d]"
                >
                  <span
                    className={`h-3 w-3 rounded-sm ${item.className}`}
                    aria-hidden="true"
                  />
                  {item.label}
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#ddcdb9] bg-white">
              <div className="border-b border-[#eadccc] px-4 py-3 text-sm text-[#6d5e51]">
                Select a numbered task to see the full instruction.
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[1120px] p-4">
                  <div className="grid grid-cols-[7.5rem_minmax(0,1fr)]">
                    <div className="sticky left-0 z-50 border-r border-[#eee3d5] bg-white" />
                    <div className="relative h-8 text-xs font-semibold text-[#8a5a22]">
                      {minuteMarkers.map((minute) => (
                        <span
                          key={minute}
                          className="absolute top-0 -translate-x-1/2"
                          style={{ left: `${(minute / totalMinutes) * 100}%` }}
                        >
                          {minute} min
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute bottom-0 left-[7.5rem] right-0 top-0 z-10">
                      {minuteMarkers.map((minute) => (
                        <span
                          key={`grid-${minute}`}
                          aria-hidden="true"
                          className="absolute bottom-0 top-0 w-px bg-[#eadccc]"
                          style={{
                            left: `${(minute / totalMinutes) * 100}%`,
                          }}
                        />
                      ))}
                      <span
                        aria-hidden="true"
                        className="absolute bottom-0 top-0 w-0.5 bg-[#211b16]"
                        style={{
                          left: `${(currentMinute / totalMinutes) * 100}%`,
                        }}
                      />
                      <span
                        className="absolute -top-7 -translate-x-1/2 rounded bg-[#211b16] px-2 py-1 text-xs font-semibold text-white"
                        style={{
                          left: `${(currentMinute / totalMinutes) * 100}%`,
                        }}
                      >
                        Now
                      </span>
                    </div>

                    {lanes.map((lane) => {
                      const laneTasks = getLanePositionedTasks(
                        activeRecipe.tasks,
                        lane,
                      );

                      return (
                        <div
                          key={lane}
                          className="grid grid-cols-[7.5rem_minmax(0,1fr)] border-t border-[#eee3d5]"
                          style={{ minHeight: getLaneHeight(laneTasks) }}
                        >
                          <div className="sticky left-0 z-50 flex items-center border-r border-[#eee3d5] bg-white pr-4 text-sm font-semibold text-[#3e342d] shadow-[8px_0_12px_-12px_rgba(33,27,22,0.8)]">
                            {lane}
                          </div>
                          <div className="relative my-3 rounded bg-[#f8efe3]">
                            {laneTasks.map((task) => {
                              const selected = task.id === selectedTask.id;
                              const expanded = task.id === expandedTaskId;

                              return (
                                <button
                                  key={task.id}
                                  type="button"
                                  onClick={() => setSelectedTaskId(task.id)}
                                  onFocus={() => setHoveredTaskId(task.id)}
                                  onBlur={() => setHoveredTaskId(null)}
                                  onMouseEnter={() => setHoveredTaskId(task.id)}
                                  onMouseLeave={() => setHoveredTaskId(null)}
                                  aria-pressed={selected}
                                  className={`group absolute flex h-9 items-center justify-center rounded-md px-2 text-xs font-semibold shadow-sm transition-[filter,box-shadow,min-width] hover:z-40 hover:min-w-max hover:px-3 focus:z-40 focus:min-w-max focus:px-3 focus:outline-none focus:ring-2 focus:ring-[#211b16] focus:ring-offset-2 ${
                                    laneStyles[task.lane]
                                  } ${
                                    selected
                                      ? "ring-2 ring-[#211b16] ring-offset-2"
                                      : "hover:brightness-95"
                                  } ${
                                    expanded
                                      ? "z-40 min-w-max px-3"
                                      : "z-20 overflow-hidden"
                                  }`}
                                  style={{
                                    left: getTaskLeft(task),
                                    top: `${0.5 + task.visualTrack * 2.75}rem`,
                                    width: `calc(${getTaskWidth(task)} - 0.25rem)`,
                                  }}
                                  title={`${task.id}. ${task.instruction}`}
                                >
                                  <span
                                    className={
                                      expanded
                                        ? "whitespace-nowrap"
                                        : "truncate group-hover:overflow-visible group-hover:text-clip group-hover:whitespace-nowrap group-focus:overflow-visible group-focus:text-clip group-focus:whitespace-nowrap"
                                    }
                                  >
                                    {expanded
                                      ? getExpandedBlockLabel(task)
                                      : getExpandedBlockLabel(task)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <aside className="rounded-lg border border-[#ddcdb9] bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                Selected task
              </p>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {selectedTask.id}. {selectedTask.shortLabel}
                  </h2>
                  <p className="mt-2 text-lg text-[#3e342d]">
                    {selectedTask.instruction}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-3 py-2 text-sm font-semibold ${laneStyles[selectedTask.lane]}`}
                >
                  {selectedTask.lane}
                </span>
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-md bg-[#f8efe3] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5a22]">
                    Timing
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {formatMinuteRange(selectedTask)}
                  </dd>
                </div>
                <div className="rounded-md bg-[#f8efe3] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5a22]">
                    Status
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {getTaskStatus(selectedTask)}
                  </dd>
                </div>
                <div className="rounded-md bg-[#f8efe3] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a5a22]">
                    Mode
                  </dt>
                  <dd className="mt-1 font-semibold">
                    {selectedTask.workMode}
                  </dd>
                </div>
              </dl>
            </aside>

            <aside className="rounded-lg border border-[#ddcdb9] bg-white p-5">
              <h2 className="text-xl font-semibold tracking-tight">
                Now / Next / Later
              </h2>
              <p className="mt-1 text-sm text-[#6d5e51]">
                Showing all {allTasks.length} extracted steps for prototype
                review.
              </p>
              <div className="mt-5 space-y-5">
                {completedTasks.length > 0 ? (
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                      Completed
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {completedTasks.map((task) => (
                        <TaskSummary
                          key={`completed-${task.id}`}
                          task={task}
                          selected={task.id === selectedTask.id}
                          onSelect={setSelectedTaskId}
                        />
                      ))}
                    </ul>
                  </section>
                ) : null}

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                    Now
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {activeTasks.length > 0 ? (
                      activeTasks.map((task) => (
                        <TaskSummary
                          key={`now-${task.id}`}
                          task={task}
                          selected={task.id === selectedTask.id}
                          onSelect={setSelectedTaskId}
                        />
                      ))
                    ) : (
                      <li className="rounded-md border border-[#ddcdb9] bg-white px-3 py-2 text-sm text-[#6d5e51]">
                        No active task at minute {currentMinute}.
                      </li>
                    )}
                  </ul>
                </section>

                {nextTask ? (
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                      Next
                    </h3>
                    <ul className="mt-2 space-y-2">
                      <TaskSummary
                        task={nextTask}
                        selected={nextTask.id === selectedTask.id}
                        onSelect={setSelectedTaskId}
                      />
                    </ul>
                  </section>
                ) : null}

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                    Later
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {laterTasks.map((task) => (
                      <TaskSummary
                        key={`later-${task.id}`}
                        task={task}
                        selected={task.id === selectedTask.id}
                        onSelect={setSelectedTaskId}
                      />
                    ))}
                  </ul>
                </section>
              </div>
            </aside>
          </section>
        </section>
        ) : (
          <section className="rounded-lg border border-[#ddcdb9] bg-white p-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Timeline preview
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-[#6d5e51]">
              Select a recipe photo or paste a recipe link to create a
              timeline. The finished dish photo is preview-only for now.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
