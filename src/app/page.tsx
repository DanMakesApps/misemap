"use client";

import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

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
  recipeId?: string;
  recipeTitle?: string;
  recipeColor?: string;
  recipeEndMinute?: number;
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
  thumbnailUrl?: string | null;
};

type UploadedImage = {
  id: string;
  name: string;
  previewUrl: string;
  role: "recipe" | "dish";
};

type ExtractRecipeResponse = {
  recipe?: RecipeData;
  error?: string;
};

type RecipeLinkPreview = {
  title: string;
  siteName: string;
  imageUrl: string;
};

type BuilderPanel = "photos" | "link" | "previous";
type MenuCourse = "Starter" | "Main" | "Side Dish" | "Dessert";

type MenuRecipe = {
  id: string;
  color: string;
  serveOffsetMinutes: number;
  course: MenuCourse;
  thumbnailUrl: string | null;
  recipe: RecipeData;
};

type ScheduledMenuRecipe = MenuRecipe & {
  durationMinutes: number;
  startMinute: number;
  endMinute: number;
};

const initialElapsedSeconds = 0;
const lanes: Lane[] = ["Prep", "Hob", "Oven", "Passive", "Serve"];
const recipeColors = [
  "#2f6f4e",
  "#b85428",
  "#7b4f9d",
  "#1f6f8b",
  "#8a5a22",
  "#9f3a5f",
];
const previousRecipesStorageKey = "misemap.previousRecipes.v1";
const menuCourses: MenuCourse[] = ["Starter", "Main", "Side Dish", "Dessert"];

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

const laneLegend: Array<{ label: Lane; className: string }> = [
  { label: "Prep", className: laneStyles.Prep },
  { label: "Hob", className: laneStyles.Hob },
  { label: "Oven", className: laneStyles.Oven },
  { label: "Passive", className: laneStyles.Passive },
  { label: "Serve", className: laneStyles.Serve },
];

function getActiveTasks(recipeTasks: TimelineTask[], currentMinute: number) {
  return recipeTasks.filter(
    (task) =>
      task.startMinute <= currentMinute &&
      currentMinute < task.startMinute + task.durationMinutes,
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

function createMenuRecipe(
  recipe: RecipeData,
  index: number,
  options: { thumbnailUrl?: string | null; course?: MenuCourse } = {},
): MenuRecipe {
  return {
    id: `${recipe.title || "recipe"}-${Date.now()}-${crypto.randomUUID()}`,
    color: recipeColors[index % recipeColors.length],
    serveOffsetMinutes: 0,
    course: options.course ?? "Main",
    thumbnailUrl: options.thumbnailUrl ?? null,
    recipe,
  };
}

function getScheduledMenuRecipes(
  menuRecipes: MenuRecipe[],
): ScheduledMenuRecipe[] {
  const baseServingMinute = Math.max(
    0,
    ...menuRecipes.map(
      (menuRecipe) =>
        getRecipeDuration(menuRecipe.recipe.tasks) -
        menuRecipe.serveOffsetMinutes,
    ),
  );

  return menuRecipes.map((menuRecipe) => {
    const durationMinutes = getRecipeDuration(menuRecipe.recipe.tasks);
    const endMinute = baseServingMinute + menuRecipe.serveOffsetMinutes;

    return {
      ...menuRecipe,
      durationMinutes,
      startMinute: Math.max(0, endMinute - durationMinutes),
      endMinute,
    };
  });
}

function combineMenuRecipes(menuRecipes: MenuRecipe[]): RecipeData | null {
  if (menuRecipes.length === 0) {
    return null;
  }

  const scheduledMenuRecipes = getScheduledMenuRecipes(menuRecipes);
  let nextTaskId = 1;
  const tasks = scheduledMenuRecipes
    .flatMap((menuRecipe) =>
      menuRecipe.recipe.tasks.map((task) => ({
        ...task,
        id: nextTaskId++,
        startMinute: task.startMinute + menuRecipe.startMinute,
        recipeId: menuRecipe.id,
        recipeTitle: menuRecipe.recipe.title,
        recipeColor: menuRecipe.color,
        recipeEndMinute: menuRecipe.endMinute,
      })),
    )
    .sort(
      (a, b) =>
        a.startMinute - b.startMinute ||
        a.durationMinutes - b.durationMinutes ||
        a.id - b.id,
    )
    .map((task, index) => ({
      ...task,
      id: index + 1,
    }));

  return {
    title:
      menuRecipes.length === 1
        ? menuRecipes[0].recipe.title
        : `${menuRecipes.length} recipe menu`,
    servings: null,
    ingredients: menuRecipes.flatMap((menuRecipe) =>
      menuRecipe.recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        name: `${ingredient.name} (${menuRecipe.recipe.title})`,
      })),
    ),
    tasks,
    assumptions: menuRecipes.flatMap((menuRecipe) =>
      menuRecipe.recipe.assumptions.map(
        (assumption) => `${menuRecipe.recipe.title}: ${assumption}`,
      ),
    ),
    uncertainties: menuRecipes.flatMap((menuRecipe) =>
      menuRecipe.recipe.uncertainties.map(
        (uncertainty) => `${menuRecipe.recipe.title}: ${uncertainty}`,
      ),
    ),
  };
}

function getRecipeDurationLabel(recipeTasks: TimelineTask[]) {
  const duration = getRecipeDuration(recipeTasks);

  if (duration < 60) {
    return `${duration} mins`;
  }

  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} mins`;
}

function getRecipeStorageKey(recipe: RecipeData) {
  return recipe.title.trim().toLowerCase();
}

function dedupeRecipes(recipes: RecipeData[]) {
  const seenRecipeKeys = new Set<string>();

  return recipes.filter((recipe) => {
    const key = getRecipeStorageKey(recipe);

    if (!key || seenRecipeKeys.has(key)) {
      return false;
    }

    seenRecipeKeys.add(key);
    return true;
  });
}

function getStoredRecipes() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedRecipes = window.localStorage.getItem(previousRecipesStorageKey);

    if (!storedRecipes) {
      return [];
    }

    const parsedRecipes = JSON.parse(storedRecipes) as RecipeData[];
    return dedupeRecipes(parsedRecipes.map(normalizeExtractedRecipe));
  } catch {
    return [];
  }
}

function formatMinuteRange(task: TimelineTask) {
  return `${task.startMinute}-${task.startMinute + task.durationMinutes} min`;
}

function formatDuration(task: TimelineTask) {
  return `${task.durationMinutes} min${task.durationMinutes === 1 ? "" : "s"}`;
}

function getRecipeDuration(recipeTasks: TimelineTask[]) {
  const recipeEndMinute = Math.max(
    0,
    ...recipeTasks.map((task) => task.startMinute + task.durationMinutes),
  );

  return Math.max(1, recipeEndMinute);
}

function getMinuteMarkers(totalMinutes: number) {
  const markerCount = Math.floor(totalMinutes / 15);

  const markers = Array.from(
    { length: markerCount + 1 },
    (_, index) => index * 15,
  );

  if (markers[markers.length - 1] !== totalMinutes) {
    markers.push(totalMinutes);
  }

  return markers;
}

function formatTimer(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getTaskWidth(task: TimelineTask, totalMinutes: number) {
  return `${(task.durationMinutes / totalMinutes) * 100}%`;
}

function getTaskLeft(task: TimelineTask, totalMinutes: number) {
  return `${(task.startMinute / totalMinutes) * 100}%`;
}

function getTaskRight(task: TimelineTask, totalMinutes: number) {
  return `${100 - ((task.startMinute + task.durationMinutes) / totalMinutes) * 100}%`;
}

function shouldAnchorTaskToRight(task: TimelineTask, totalMinutes: number) {
  return task.startMinute + task.durationMinutes > totalMinutes * 0.88;
}

function getEdgeAwareTransform(minute: number, totalMinutes: number) {
  if (minute <= totalMinutes * 0.02) {
    return "translateX(0)";
  }

  if (minute >= totalMinutes * 0.98) {
    return "translateX(-100%)";
  }

  return "translateX(-50%)";
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

function getLaneHeight(
  laneTasks: Array<TimelineTask & { visualTrack: number }>,
  compact = false,
) {
  const maxTrack = Math.max(0, ...laneTasks.map((task) => task.visualTrack));

  return compact
    ? `${3.1 + maxTrack * 2.1}rem`
    : `${4.75 + maxTrack * 2.75}rem`;
}

function getTaskStatus(
  task: TimelineTask,
  currentMinute: number,
  completedTaskIds: Set<number>,
) {
  const endMinute = task.startMinute + task.durationMinutes;

  if (completedTaskIds.has(task.id)) {
    return "Done";
  }

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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getIngredientHighlightTerms(ingredients: Ingredient[]) {
  const terms = new Set<string>();
  const stopWords = new Set([
    "and",
    "or",
    "the",
    "with",
    "their",
    "for",
    "each",
    "plus",
    "more",
    "to",
  ]);

  ingredients.forEach((ingredient) => {
    [ingredient.amount, ingredient.name].forEach((value) => {
      const trimmedValue = value.trim();

      if (trimmedValue.length >= 2) {
        terms.add(trimmedValue);
      }

      trimmedValue
        .split(/\s+/)
        .map((part) => part.replace(/^[,.;:()]+|[,.;:()]+$/g, ""))
        .filter(
          (part) =>
            (part.length >= 3 || /\d/.test(part)) &&
            !stopWords.has(part.toLowerCase()),
        )
        .forEach((part) => terms.add(part));
    });
  });

  return Array.from(terms).sort((a, b) => b.length - a.length);
}

function highlightIngredients(
  text: string,
  ingredients: Ingredient[],
): ReactNode {
  const terms = getIngredientHighlightTerms(ingredients);

  if (terms.length === 0) {
    return text;
  }

  const pattern = new RegExp(
    `(^|[^A-Za-z0-9])(${terms.map(escapeRegExp).join("|")})(?=$|[^A-Za-z0-9])`,
    "gi",
  );
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  Array.from(text.matchAll(pattern)).forEach((match, index) => {
    const matchedText = match[0];
    const prefix = match[1] ?? "";
    const term = match[2] ?? "";
    const matchStart = match.index ?? 0;
    const termStart = matchStart + prefix.length;

    if (matchStart > lastIndex) {
      nodes.push(text.slice(lastIndex, matchStart));
    }

    if (prefix) {
      nodes.push(prefix);
    }

    nodes.push(
      <strong key={`${term}-${index}`} className="font-semibold">
        {term}
      </strong>,
    );

    lastIndex = matchStart + matchedText.length;
    if (lastIndex < termStart + term.length) {
      lastIndex = termStart + term.length;
    }
  });

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

function LaneIcon({ lane }: { lane: Lane }) {
  const commonProps = {
    className: "h-4 w-4",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  if (lane === "Prep") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M14 4l6 6" />
        <path d="M3 21l8.5-8.5" />
        <path d="M13 5l6 6-2 2-6-6z" />
      </svg>
    );
  }

  if (lane === "Hob") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M6 10h12l-1 8H7z" />
        <path d="M8 10V8a4 4 0 018 0v2" />
        <path d="M4 18h16" />
      </svg>
    );
  }

  if (lane === "Oven") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 21c3 0 5-2 5-5 0-2.5-1.5-4-3-5.5-.8 2-2.4 2.9-3.8 4.2A3.8 3.8 0 0012 21z" />
        <path d="M12 3c1 2.5-.8 4.1-2.2 5.6C8.6 9.9 8 11 8 12.5" />
      </svg>
    );
  }

  if (lane === "Passive") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <circle cx="12" cy="13" r="7" />
        <path d="M12 13V9" />
        <path d="M12 13l3 2" />
        <path d="M9 2h6" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...commonProps}>
      <circle cx="12" cy="10" r="4" />
      <path d="M4 20h16" />
      <path d="M7 20a5 5 0 0110 0" />
      <path d="M5 5v8" />
      <path d="M19 5v8" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M4 4v16" />
      <path d="M7 4v5" />
      <path d="M4 9h3" />
      <path d="M18 4v16" />
      <path d="M20 4v16" />
    </svg>
  );
}

function ServingsIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="7" />
      <path d="M4 20h16" />
      <path d="M7 4v6" />
      <path d="M17 4v6" />
    </svg>
  );
}

function OffsetIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="13" r="7" />
      <path d="M12 13V9" />
      <path d="M12 13l3 2" />
      <path d="M9 2h6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function SourcePanel({
  title,
  summary,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#ddcdb9] bg-white 2xl:h-full">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-[#fffaf3] focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#2f6f4e] 2xl:pointer-events-none"
      >
        <span className="min-w-0">
          <span className="block text-lg font-semibold tracking-tight text-[#211b16]">
            {title}
          </span>
          <span className="mt-1 block text-sm text-[#6d5e51]">{summary}</span>
        </span>
        <span className="shrink-0 rounded-md border border-[#ddcdb9] px-2 py-1 text-xs font-semibold text-[#3e342d] 2xl:hidden">
          {expanded ? "Collapse" : "Open"}
        </span>
      </button>
      <div
        className={`min-h-0 flex-1 border-t border-[#eadccc] p-4 ${
          expanded ? "block md:flex md:flex-col" : "hidden 2xl:flex 2xl:flex-col"
        }`}
      >
        {children}
      </div>
    </section>
  );
}

function TaskSummary({
  task,
  selected,
  completed,
  statusLabel,
  onSelect,
}: {
  task: TimelineTask;
  selected: boolean;
  completed: boolean;
  statusLabel: string;
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
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-[#211b16]">
              {task.id}. {task.shortLabel}
            </span>
            {task.recipeTitle ? (
              <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#6d5e51]">
                <span
                  className="h-2 w-2 rounded-sm"
                  style={{ backgroundColor: task.recipeColor }}
                  aria-hidden="true"
                />
                {task.recipeTitle}
              </span>
            ) : null}
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-xs font-medium text-[#8a5a22]">
              {formatMinuteRange(task)}
            </span>
            <span className="mt-0.5 block text-xs font-semibold text-[#2f6f4e]">
              {formatDuration(task)}
            </span>
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 text-[#6d5e51]">
            <LaneIcon lane={task.lane} />
            {task.lane}
          </span>
          <span
            className={`rounded px-2 py-0.5 font-semibold ${
              completed
                ? "bg-[#eef7f0] text-[#2f6f4e]"
                : statusLabel === "Active now"
                  ? "bg-[#211b16] text-white"
                  : "bg-[#f8efe3] text-[#8a5a22]"
            }`}
          >
            {statusLabel}
          </span>
        </div>
      </button>
    </li>
  );
}

function IngredientsPanel({
  ingredients,
  className = "",
  scrollable = false,
}: {
  ingredients: Ingredient[];
  className?: string;
  scrollable?: boolean;
}) {
  return (
    <section
      className={`rounded-lg border border-[#ddcdb9] bg-white p-5 ${
        scrollable ? "flex min-h-0 flex-col overflow-hidden" : ""
      } ${className}`}
    >
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
        Ingredients
      </h3>
      {ingredients.length > 0 ? (
        <ul
          className={`mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1 ${
            scrollable ? "min-h-0 flex-1 overflow-y-auto pr-1" : ""
          }`}
        >
          {ingredients.map((ingredient) => (
            <li
              key={`${ingredient.amount}-${ingredient.name}`}
              className="rounded-md bg-[#f8efe3] px-3 py-2 text-sm text-[#3e342d]"
            >
              <span className="font-semibold">{ingredient.amount}</span>{" "}
              {ingredient.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#6d5e51]">
          No ingredients returned.
        </p>
      )}
    </section>
  );
}

function MenuIngredientsPanel({
  menuRecipes,
  selectedRecipeId,
  onSelectRecipe,
  className = "",
  scrollable = false,
}: {
  menuRecipes: MenuRecipe[];
  selectedRecipeId: string | null;
  onSelectRecipe: (recipeId: string) => void;
  className?: string;
  scrollable?: boolean;
}) {
  const selectedRecipe =
    menuRecipes.find((menuRecipe) => menuRecipe.id === selectedRecipeId) ??
    menuRecipes[0];

  if (!selectedRecipe) {
    return <IngredientsPanel ingredients={[]} className={className} />;
  }

  return (
    <section
      className={`rounded-lg border border-[#ddcdb9] bg-white p-5 ${
        scrollable ? "flex min-h-0 flex-col overflow-hidden" : ""
      } ${className}`}
    >
      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
        Ingredients
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {menuRecipes.map((menuRecipe) => (
          <button
            key={`ingredient-tab-${menuRecipe.id}`}
            type="button"
            onClick={() => onSelectRecipe(menuRecipe.id)}
            className={`inline-flex h-8 items-center gap-2 rounded-md border px-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 ${
              menuRecipe.id === selectedRecipe.id
                ? "border-[#2f6f4e] bg-[#eef7f0] text-[#211b16]"
                : "border-[#ddcdb9] bg-white text-[#3e342d] hover:border-[#8a5a22]"
            }`}
          >
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: menuRecipe.color }}
              aria-hidden="true"
            />
            {menuRecipe.recipe.title}
          </button>
        ))}
      </div>
      {selectedRecipe.recipe.ingredients.length > 0 ? (
        <ul
          className={`mt-3 grid gap-2 sm:grid-cols-2 2xl:grid-cols-1 ${
            scrollable ? "min-h-0 flex-1 overflow-y-auto pr-1" : ""
          }`}
        >
          {selectedRecipe.recipe.ingredients.map((ingredient) => (
            <li
              key={`${selectedRecipe.id}-${ingredient.amount}-${ingredient.name}`}
              className="rounded-md bg-[#f8efe3] px-3 py-2 text-sm text-[#3e342d]"
            >
              <span className="font-semibold">{ingredient.amount}</span>{" "}
              {ingredient.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[#6d5e51]">
          No ingredients returned.
        </p>
      )}
    </section>
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
                role: "recipe",
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
  canExtract,
  extracting,
  extractError,
  embedded = false,
  onImagesAdd,
  onImageRemove,
  onImageRoleChange,
  onExtract,
}: {
  id: string;
  title: string;
  description: string;
  images: UploadedImage[];
  canExtract: boolean;
  extracting: boolean;
  extractError: string | null;
  embedded?: boolean;
  onImagesAdd: (images: UploadedImage[]) => void;
  onImageRemove: (imageId: string) => void;
  onImageRoleChange: (imageId: string, role: UploadedImage["role"]) => void;
  onExtract: () => void;
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
    <div
      className={`flex min-h-0 flex-1 flex-col overflow-hidden ${
        embedded ? "" : "rounded-lg border border-[#ddcdb9] bg-white p-5"
      }`}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {embedded ? null : (
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1 text-sm text-[#6d5e51]">{description}</p>
          </div>
        )}

        <div className="min-h-48 flex-1 rounded-md border border-dashed border-[#cbb79d] bg-[#fffaf3] p-2">
          {images.length > 0 ? (
            <ul className="grid h-full max-h-44 grid-cols-2 content-start gap-2 overflow-y-auto pr-1 md:max-h-none">
              {images.map((image) => (
                <li
                  key={image.id}
                  className="group relative h-32 overflow-hidden rounded-md border border-[#ddcdb9] bg-white"
                >
                  <span
                    role="img"
                    aria-label={`${image.name} preview`}
                    className="block h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${image.previewUrl})` }}
                  />
                  <button
                    type="button"
                    onClick={() => onImageRemove(image.id)}
                    aria-label={`Remove ${image.name}`}
                    className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/70 bg-[#211b16]/75 text-xs font-semibold text-white shadow-sm transition hover:bg-[#a33b24] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2"
                  >
                    X
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onImageRoleChange(
                        image.id,
                        image.role === "dish" ? "recipe" : "dish",
                      )
                    }
                    className={`absolute inset-x-1 bottom-1 rounded-sm border px-1.5 py-1 text-[0.65rem] font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 ${
                      image.role === "dish"
                        ? "border-[#2f6f4e] bg-[#eef7f0] text-[#2f6f4e]"
                        : "border-white/70 bg-white/90 text-[#3e342d] hover:border-[#8a5a22]"
                    }`}
                  >
                    {image.role === "dish" ? "Dish photo" : "Recipe Image"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <label
              htmlFor={id}
              className="flex min-h-44 cursor-pointer items-center justify-center text-center transition hover:text-[#8a5a22]"
            >
              <span className="px-6 text-sm font-medium text-[#6d5e51]">
                Select one or more images
              </span>
            </label>
          )}
        </div>

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
          <button
            type="button"
            onClick={onExtract}
            disabled={!canExtract}
            className="inline-flex h-10 w-fit items-center justify-center rounded-md bg-[#2f6f4e] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#285f43] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-[#9ca99f]"
          >
            {extracting ? "Adding..." : "Add photo recipe"}
          </button>
        </div>

        {pasteError || extractError ? (
          <p className="text-sm font-medium text-[#a33b24]">
            {pasteError ?? extractError}
          </p>
        ) : null}

      </div>
    </div>
  );
}

export default function Home() {
  const cockpitRef = useRef<HTMLDivElement | null>(null);
  const [recipeImages, setRecipeImages] = useState<UploadedImage[]>([]);
  const [recipeUrl, setRecipeUrl] = useState("");
  const [recipeLinkPreview, setRecipeLinkPreview] =
    useState<RecipeLinkPreview | null>(null);
  const [recipeLinkPreviewLoading, setRecipeLinkPreviewLoading] =
    useState(false);
  const [recipeLinkPreviewError, setRecipeLinkPreviewError] = useState<
    string | null
  >(null);
  const [recipe, setRecipe] = useState<RecipeData | null>(null);
  const [menuRecipes, setMenuRecipes] = useState<MenuRecipe[]>([]);
  const [previousRecipes, setPreviousRecipes] =
    useState<RecipeData[]>(getStoredRecipes);
  const [selectedIngredientRecipeId, setSelectedIngredientRecipeId] =
    useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [sourceNotice, setSourceNotice] = useState<string | null>(null);
  const [extractionNotesOpen, setExtractionNotesOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(initialElapsedSeconds);
  const [timerRunning, setTimerRunning] = useState(false);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [previousElapsedByTaskId, setPreviousElapsedByTaskId] = useState<
    Record<number, number>
  >({});
  const [recipeSourceOpen, setRecipeSourceOpen] = useState(true);
  const [isCockpitFullscreen, setIsCockpitFullscreen] = useState(false);
  const [expandedBuilderPanel, setExpandedBuilderPanel] =
    useState<BuilderPanel | null>(null);
  const combinedMenuRecipe = combineMenuRecipes(menuRecipes);
  const scheduledMenuRecipes = getScheduledMenuRecipes(menuRecipes);
  const activeRecipe = combinedMenuRecipe ?? recipe ?? sampleRecipe;
  const totalMinutes = getRecipeDuration(activeRecipe.tasks);
  const minuteMarkers = getMinuteMarkers(totalMinutes);
  const currentMinute = Math.min(elapsedSeconds / 60, totalMinutes);
  const timelineWidth = Math.max(1040, totalMinutes * 18);
  const orderedTasks = [...activeRecipe.tasks].sort((a, b) => a.id - b.id);
  const activeTasks = getActiveTasks(activeRecipe.tasks, currentMinute).filter(
    (task) => !completedTaskIds.has(task.id),
  );
  const [selectedTaskId, setSelectedTaskId] = useState(
    () => sampleRecipe.tasks[0].id,
  );
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const selectedTask =
    activeRecipe.tasks.find((task) => task.id === selectedTaskId) ??
    activeTasks[0] ??
    orderedTasks[0] ??
    sampleRecipe.tasks[0];
  const selectedTaskIngredients =
    menuRecipes.find((menuRecipe) => menuRecipe.id === selectedTask.recipeId)
      ?.recipe.ingredients ?? activeRecipe.ingredients;
  const expandedTaskId = hoveredTaskId;
  const recipeImageInputs = recipeImages.filter(
    (image) => image.role === "recipe",
  );
  const canExtractPhoto = recipeImageInputs.length > 0 && !extracting;
  const canExtractLink = Boolean(recipeUrl.trim() && !extracting);
  const hasMenu = menuRecipes.length > 0;
  const extractionNotes = [
    ...activeRecipe.assumptions,
    ...activeRecipe.uncertainties,
  ];
  const menuSections = [
    {
      label: "Starter",
      recipes: menuRecipes.filter((menuRecipe) => menuRecipe.course === "Starter"),
    },
    {
      label: "Main",
      recipes: [
        ...menuRecipes.filter((menuRecipe) => menuRecipe.course === "Main"),
        ...menuRecipes.filter((menuRecipe) => menuRecipe.course === "Side Dish"),
      ],
    },
    {
      label: "Dessert",
      recipes: menuRecipes.filter((menuRecipe) => menuRecipe.course === "Dessert"),
    },
  ];
  const sourceColumnRows =
    expandedBuilderPanel === null
      ? ""
      : expandedBuilderPanel === "photos"
      ? "lg:grid-rows-[minmax(0,1fr)_auto_auto]"
      : expandedBuilderPanel === "link"
        ? "lg:grid-rows-[auto_minmax(0,1fr)_auto]"
        : "lg:grid-rows-[auto_auto_minmax(0,1fr)]";
  const sourceColumnHeight = expandedBuilderPanel ? "lg:h-[42rem]" : "";

  useEffect(() => {
    if (!timerRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((seconds) => {
        const nextSeconds = seconds + 1;
        const maxSeconds = totalMinutes * 60;

        if (nextSeconds >= maxSeconds) {
          setTimerRunning(false);
          return maxSeconds;
        }

        return nextSeconds;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerRunning, totalMinutes]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsCockpitFullscreen(document.fullscreenElement === cockpitRef.current);
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      previousRecipesStorageKey,
      JSON.stringify(previousRecipes),
    );
  }, [previousRecipes]);

  useEffect(() => {
    const trimmedRecipeUrl = recipeUrl.trim();

    if (!trimmedRecipeUrl) {
      return;
    }

    try {
      const parsedUrl = new URL(trimmedRecipeUrl);

      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return;
      }
    } catch {
      return;
    }

    const abortController = new AbortController();
    const previewDelay = window.setTimeout(async () => {
      setRecipeLinkPreviewLoading(true);

      try {
        const response = await fetch("/api/recipe-link-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmedRecipeUrl }),
          signal: abortController.signal,
        });
        const payload = (await response.json()) as
          | RecipeLinkPreview
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Preview unavailable.",
          );
        }

        setRecipeLinkPreview(payload as RecipeLinkPreview);
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setRecipeLinkPreview(null);
        setRecipeLinkPreviewError(
          error instanceof Error ? error.message : "Preview unavailable.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setRecipeLinkPreviewLoading(false);
        }
      }
    }, 500);

    return () => {
      abortController.abort();
      window.clearTimeout(previewDelay);
    };
  }, [recipeUrl]);

  function handleRecipeImagesAdd(images: UploadedImage[]) {
    setRecipeImages((currentImages) => [...currentImages, ...images]);
    setRecipe(null);
    setExtractError(null);
    setSourceNotice(null);
    setCompletedTaskIds(new Set());
    setPreviousElapsedByTaskId({});
    setElapsedSeconds(initialElapsedSeconds);
    setTimerRunning(false);
  }

  function handleRecipeImageRemove(imageId: string) {
    setRecipeImages((currentImages) =>
      currentImages.filter((image) => image.id !== imageId),
    );
    setRecipe(null);
    setExtractError(null);
    setSourceNotice(null);
    setCompletedTaskIds(new Set());
    setPreviousElapsedByTaskId({});
    setElapsedSeconds(initialElapsedSeconds);
    setTimerRunning(false);
  }

  function handleRecipeImageRoleChange(
    imageId: string,
    role: UploadedImage["role"],
  ) {
    setRecipeImages((currentImages) =>
      currentImages.map((image) => ({
        ...image,
        role:
          image.id === imageId
            ? role
            : role === "dish"
              ? "recipe"
              : image.role,
      })),
    );
  }

  function addRecipeToMenu(
    extractedRecipe: RecipeData,
    options: { thumbnailUrl?: string | null; course?: MenuCourse } = {},
  ) {
    const menuRecipe = createMenuRecipe(
      extractedRecipe,
      menuRecipes.length,
      options,
    );
    const nextMenuRecipes = [...menuRecipes, menuRecipe];
    const blendedRecipe = combineMenuRecipes(nextMenuRecipes);
    const firstSelectedTask =
      blendedRecipe?.tasks.find((task) => task.recipeId === menuRecipe.id) ??
      blendedRecipe?.tasks[0];

    setMenuRecipes(nextMenuRecipes);
    setSelectedIngredientRecipeId(menuRecipe.id);
    setRecipe(extractedRecipe);
    setCompletedTaskIds(new Set());
    setPreviousElapsedByTaskId({});
    setElapsedSeconds(initialElapsedSeconds);
    setTimerRunning(false);
    setRecipeSourceOpen(true);
    if (firstSelectedTask) {
      setSelectedTaskId(firstSelectedTask.id);
    }
  }

  function addRecipeToPreviousRecipes(
    extractedRecipe: RecipeData,
    options: { thumbnailUrl?: string | null } = {},
  ) {
    const recipeAlreadySaved = previousRecipes.some(
      (previousRecipe) =>
        getRecipeStorageKey(previousRecipe) === getRecipeStorageKey(extractedRecipe),
    );

    if (recipeAlreadySaved) {
      setSourceNotice(
        `${extractedRecipe.title} is already in Previously used, so MiseMap did not save another copy.`,
      );
      return;
    }

    setPreviousRecipes((currentRecipes) =>
      dedupeRecipes([
        {
          ...extractedRecipe,
          thumbnailUrl: options.thumbnailUrl ?? extractedRecipe.thumbnailUrl ?? null,
        },
        ...currentRecipes,
      ]),
    );
    setSourceNotice(null);
  }

  function addPreviousRecipeToMenu(previousRecipe: RecipeData) {
    addRecipeToMenu(normalizeExtractedRecipe(previousRecipe), {
      thumbnailUrl: previousRecipe.thumbnailUrl ?? null,
    });
  }

  function removePreviousRecipe(recipeTitle: string) {
    const recipeKey = recipeTitle.trim().toLowerCase();

    setPreviousRecipes((currentRecipes) =>
      currentRecipes.filter(
        (previousRecipe) => getRecipeStorageKey(previousRecipe) !== recipeKey,
      ),
    );
  }

  function removeRecipeFromMenu(recipeId: string) {
    const nextMenuRecipes = menuRecipes.filter(
      (menuRecipe) => menuRecipe.id !== recipeId,
    );
    const blendedRecipe = combineMenuRecipes(nextMenuRecipes);

    setMenuRecipes(nextMenuRecipes);
    setSelectedIngredientRecipeId(nextMenuRecipes[0]?.id ?? null);
    setRecipe(nextMenuRecipes.at(-1)?.recipe ?? null);
    setCompletedTaskIds(new Set());
    setPreviousElapsedByTaskId({});
    setElapsedSeconds(initialElapsedSeconds);
    setTimerRunning(false);
    setSelectedTaskId(
      blendedRecipe?.tasks[0]?.id ?? sampleRecipe.tasks[0].id,
    );
    if (nextMenuRecipes.length === 0) {
      setRecipeSourceOpen(true);
    }
  }

  function updateMenuRecipeServings(recipeId: string, servings: number | null) {
    setMenuRecipes((currentMenuRecipes) =>
      currentMenuRecipes.map((menuRecipe) =>
        menuRecipe.id === recipeId
          ? {
              ...menuRecipe,
              recipe: {
                ...menuRecipe.recipe,
                servings,
              },
            }
          : menuRecipe,
      ),
    );
  }

  function updateMenuRecipeServeOffset(
    recipeId: string,
    serveOffsetMinutes: number,
  ) {
    setMenuRecipes((currentMenuRecipes) =>
      currentMenuRecipes.map((menuRecipe) =>
        menuRecipe.id === recipeId
          ? {
              ...menuRecipe,
              serveOffsetMinutes: Math.max(0, serveOffsetMinutes),
            }
          : menuRecipe,
      ),
    );
  }

  function updateMenuRecipeCourse(recipeId: string, course: MenuCourse) {
    setMenuRecipes((currentMenuRecipes) =>
      currentMenuRecipes.map((menuRecipe) =>
        menuRecipe.id === recipeId
          ? {
              ...menuRecipe,
              course,
            }
          : menuRecipe,
      ),
    );
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
          images: recipeImageInputs.map((image) => image.previewUrl),
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
      const dishThumbnail =
        recipeImages.find((image) => image.role === "dish")?.previewUrl ??
        recipeImageInputs[0]?.previewUrl ??
        null;

      addRecipeToPreviousRecipes(extractedRecipe, {
        thumbnailUrl: dishThumbnail,
      });
      addRecipeToMenu(extractedRecipe, { thumbnailUrl: dishThumbnail });
      setRecipeImages([]);
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
      addRecipeToPreviousRecipes(extractedRecipe, {
        thumbnailUrl: recipeLinkPreview?.imageUrl ?? null,
      });
      addRecipeToMenu(extractedRecipe, {
        thumbnailUrl: recipeLinkPreview?.imageUrl ?? null,
      });
      setRecipeUrl("");
      setRecipeLinkPreview(null);
      setRecipeLinkPreviewLoading(false);
      setRecipeLinkPreviewError(null);
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

  function handleResetTimer() {
    setTimerRunning(false);
    setElapsedSeconds(initialElapsedSeconds);
    setCompletedTaskIds(new Set());
    setPreviousElapsedByTaskId({});
    setSelectedTaskId(orderedTasks[0]?.id ?? selectedTask.id);
  }

  function getNextStep(taskId: number) {
    const selectedTaskIndex = orderedTasks.findIndex((task) => task.id === taskId);

    return orderedTasks[selectedTaskIndex + 1] ?? null;
  }

  function getPreviousStep(taskId: number) {
    const selectedTaskIndex = orderedTasks.findIndex((task) => task.id === taskId);

    return orderedTasks[selectedTaskIndex - 1] ?? null;
  }

  function handleSelectPreviousStep() {
    const previousTaskToSelect = getPreviousStep(selectedTask.id);

    if (previousTaskToSelect) {
      setSelectedTaskId(previousTaskToSelect.id);
    }
  }

  function handleSelectNextStep() {
    const nextTaskToSelect = getNextStep(selectedTask.id);

    if (nextTaskToSelect) {
      setSelectedTaskId(nextTaskToSelect.id);
    }
  }

  async function handleToggleCockpitFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await cockpitRef.current?.requestFullscreen();
  }

  function handleToggleSelectedTaskDone() {
    const taskIsDone = completedTaskIds.has(selectedTask.id);
    const updatedCompletedTaskIds = new Set(completedTaskIds);

    if (taskIsDone) {
      const restoredTime = previousElapsedByTaskId[selectedTask.id];

      updatedCompletedTaskIds.delete(selectedTask.id);
      setCompletedTaskIds(updatedCompletedTaskIds);
      setPreviousElapsedByTaskId((previousTimes) => {
        const remainingTimes = { ...previousTimes };
        delete remainingTimes[selectedTask.id];

        return remainingTimes;
      });
      if (typeof restoredTime === "number") {
        setElapsedSeconds(restoredTime);
      }
      return;
    }

    updatedCompletedTaskIds.add(selectedTask.id);
    setCompletedTaskIds(updatedCompletedTaskIds);
    setPreviousElapsedByTaskId((previousTimes) => ({
      ...previousTimes,
      [selectedTask.id]: elapsedSeconds,
    }));

    const selectedTaskIndex = orderedTasks.findIndex(
      (task) => task.id === selectedTask.id,
    );
    const nextTaskToSelect =
      orderedTasks
        .slice(selectedTaskIndex + 1)
        .find((task) => !updatedCompletedTaskIds.has(task.id)) ??
      orderedTasks.find((task) => !updatedCompletedTaskIds.has(task.id));

    if (nextTaskToSelect) {
      setSelectedTaskId(nextTaskToSelect.id);
      setElapsedSeconds(nextTaskToSelect.startMinute * 60);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffaf3] text-[#211b16]">
      <section className="flex w-full max-w-none flex-col gap-10 px-6 py-8 sm:px-10 lg:px-12">
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
          <div className="flex flex-wrap items-center gap-3">
            {hasMenu && !recipeSourceOpen ? (
              <button
                type="button"
                onClick={() => setRecipeSourceOpen(true)}
                className="rounded-md border border-[#ddcdb9] bg-white px-4 py-3 text-sm font-semibold text-[#3e342d] transition hover:border-[#8a5a22] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2"
              >
                Edit menu
              </button>
            ) : null}
            <p className="rounded-md border border-[#ddcdb9] bg-white px-4 py-3 text-sm font-medium text-[#6d5e51]">
              Local prototype only
            </p>
          </div>
        </header>

        {recipeSourceOpen || !hasMenu ? (
        <section aria-labelledby="upload-recipe" className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="upload-recipe"
                className="text-2xl font-semibold tracking-tight"
              >
                Add recipes to your Menu
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-[#6d5e51]">
                Upload a recipe photo or paste a recipe link and then add it to
                your menu.
              </p>
            </div>
            <div className="relative flex flex-wrap gap-2">
              {recipe ? (
                <button
                  type="button"
                  onClick={() => setExtractionNotesOpen((open) => !open)}
                  aria-expanded={extractionNotesOpen}
                  className="inline-flex h-10 w-fit items-center justify-center rounded-md border border-[#ddcdb9] bg-white px-4 text-sm font-semibold text-[#3e342d] transition hover:border-[#8a5a22] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2"
                >
                  Extraction notes
                </button>
              ) : null}
              {hasMenu ? (
                <button
                  type="button"
                  onClick={() => setRecipeSourceOpen((open) => !open)}
                  className="inline-flex h-10 w-fit items-center justify-center rounded-md border border-[#ddcdb9] bg-white px-4 text-sm font-semibold text-[#3e342d] transition hover:border-[#8a5a22] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2"
                >
                  {recipeSourceOpen ? "Hide menu builder" : "Show menu builder"}
                </button>
              ) : null}
              {extractionNotesOpen ? (
                <div className="absolute right-0 top-12 z-50 w-[min(24rem,calc(100vw-3rem))] rounded-lg border border-[#ddcdb9] bg-white p-4 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                      Extraction notes
                    </h3>
                    <button
                      type="button"
                      onClick={() => setExtractionNotesOpen(false)}
                      className="rounded-md border border-[#ddcdb9] px-2 py-1 text-xs font-semibold text-[#3e342d] transition hover:border-[#8a5a22] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2"
                    >
                      Close
                    </button>
                  </div>
                  <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1 text-sm text-[#6d5e51]">
                    {extractionNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                    {extractionNotes.length === 0 ? (
                      <li>No assumptions or uncertainties returned.</li>
                    ) : null}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
          {sourceNotice ? (
            <p className="rounded-md border border-[#eadccc] bg-[#fffaf3] px-3 py-2 text-sm font-medium text-[#6d5e51]">
              {sourceNotice}
            </p>
          ) : null}

          {recipeSourceOpen ? (
            <>
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] 2xl:h-[34rem] 2xl:grid-cols-4 2xl:items-stretch">
                <div
                  className={`grid min-h-0 gap-3 ${sourceColumnHeight} ${sourceColumnRows} 2xl:contents 2xl:h-auto`}
                >
                  <SourcePanel
                    title="Recipe photos"
                    summary={
                      recipeImages.length === 0
                        ? "Upload or paste recipe pages from books."
                        : `${recipeImageInputs.length} recipe page${recipeImageInputs.length === 1 ? "" : "s"}, ${recipeImages.length - recipeImageInputs.length} dish photo${recipeImages.length - recipeImageInputs.length === 1 ? "" : "s"}`
                    }
                    expanded={expandedBuilderPanel === "photos"}
                    onToggle={() =>
                      setExpandedBuilderPanel((panel) =>
                        panel === "photos" ? null : "photos",
                      )
                    }
                  >
                    <MultiImageUploadCard
                      id="recipe-photo"
                      title="Recipe photos"
                      description="Add one or more photos or pasted screengrabs. Mark one thumbnail as the finished dish photo if you want to keep it as preview-only."
                      images={recipeImages}
                      canExtract={canExtractPhoto}
                      extracting={extracting}
                      extractError={extractError}
                      embedded
                      onImagesAdd={handleRecipeImagesAdd}
                      onImageRemove={handleRecipeImageRemove}
                      onImageRoleChange={handleRecipeImageRoleChange}
                      onExtract={handleExtractRecipe}
                    />
                  </SourcePanel>

                  <SourcePanel
                    title="Recipe link"
                    summary={
                      recipeUrl.trim()
                        ? recipeLinkPreview?.title || recipeUrl.trim()
                        : "Paste a recipe URL."
                    }
                    expanded={expandedBuilderPanel === "link"}
                    onToggle={() =>
                      setExpandedBuilderPanel((panel) =>
                        panel === "link" ? null : "link",
                      )
                    }
                  >
                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="flex min-h-32 flex-1 overflow-hidden rounded-md border border-[#eadccc] bg-[#fffaf3]">
                        {recipeLinkPreview?.imageUrl ? (
                          <div
                            className="relative min-h-36 flex-1 bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${recipeLinkPreview.imageUrl})`,
                            }}
                          >
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#211b16]/80 to-transparent p-3 text-white">
                              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/80">
                                {recipeLinkPreview.siteName}
                              </p>
                              <p className="mt-1 line-clamp-2 text-sm font-semibold">
                                {recipeLinkPreview.title || "Recipe preview"}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex min-h-32 flex-1 items-center justify-center px-6 text-center">
                            <div>
                              <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#8a5a22] shadow-sm">
                                <LaneIcon lane="Serve" />
                              </span>
                              <p className="text-sm font-semibold text-[#3e342d]">
                                {recipeLinkPreviewLoading
                                  ? "Loading link preview..."
                                  : recipeUrl.trim()
                                    ? "Preview image unavailable"
                                    : "Recipe preview"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <label
                        htmlFor="recipe-url"
                        className="mt-4 text-sm font-semibold text-[#211b16]"
                      >
                        Recipe URL
                      </label>
                      <input
                        id="recipe-url"
                        type="url"
                        value={recipeUrl}
                        onChange={(event) => {
                          setRecipeUrl(event.target.value);
                          setExtractError(null);
                          setSourceNotice(null);
                          setRecipeLinkPreview(null);
                          setRecipeLinkPreviewLoading(false);
                          setRecipeLinkPreviewError(null);
                        }}
                        placeholder="https://example.com/recipe"
                        className="mt-2 h-10 w-full rounded-md border border-[#ddcdb9] bg-[#fffaf3] px-3 text-sm text-[#211b16] outline-none transition placeholder:text-[#9a8c7f] focus:border-[#2f6f4e] focus:ring-2 focus:ring-[#2f6f4e]/20"
                      />
                      {recipeLinkPreviewError ? (
                        <p className="mt-2 text-xs text-[#a33b24]">
                          {recipeLinkPreviewError}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={handleExtractRecipeLink}
                        disabled={!canExtractLink}
                        className="mt-4 inline-flex h-10 w-fit items-center justify-center rounded-md bg-[#2f6f4e] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#285f43] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:bg-[#9ca99f]"
                      >
                        {extracting ? "Importing..." : "Add link recipe"}
                      </button>
                    </div>
                  </SourcePanel>

                  <SourcePanel
                    title="Previously used"
                    summary={`${previousRecipes.length} saved recipe${previousRecipes.length === 1 ? "" : "s"}.`}
                    expanded={expandedBuilderPanel === "previous"}
                    onToggle={() =>
                      setExpandedBuilderPanel((panel) =>
                        panel === "previous" ? null : "previous",
                      )
                    }
                  >
                    {previousRecipes.length > 0 ? (
                      <ul className="grid max-h-[20rem] gap-2 overflow-x-hidden overflow-y-auto pr-1 lg:min-h-0 lg:max-h-none lg:flex-1 lg:content-start">
                        {previousRecipes.map((previousRecipe) => {
                          const alreadyInMenu = menuRecipes.some(
                            (menuRecipe) =>
                              getRecipeStorageKey(menuRecipe.recipe) ===
                              getRecipeStorageKey(previousRecipe),
                          );

                          return (
                            <li
                              key={`previous-${getRecipeStorageKey(previousRecipe)}`}
                              className="rounded-md border border-[#eadccc] bg-[#fffaf3] p-2"
                            >
                              <div className="flex min-w-0 gap-2">
                                <div
                                  className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white text-[#8a5a22]"
                                  style={
                                    previousRecipe.thumbnailUrl
                                      ? {
                                          backgroundImage: `url(${previousRecipe.thumbnailUrl})`,
                                          backgroundPosition: "center",
                                          backgroundSize: "cover",
                                        }
                                      : undefined
                                  }
                                >
                                  {previousRecipe.thumbnailUrl ? null : (
                                    <LaneIcon lane="Serve" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 overflow-hidden">
                                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                                    <div className="min-w-0">
                                      <p className="truncate font-semibold leading-6 text-[#211b16]">
                                        {previousRecipe.title}
                                      </p>
                                      <p className="truncate text-xs text-[#6d5e51]">
                                        {getRecipeDurationLabel(previousRecipe.tasks)}
                                        {previousRecipe.servings
                                          ? `, ${previousRecipe.servings} servings`
                                          : ""}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          addPreviousRecipeToMenu(previousRecipe)
                                        }
                                        disabled={alreadyInMenu}
                                        aria-label={
                                          alreadyInMenu
                                            ? `${previousRecipe.title} is already in the menu`
                                            : `Add ${previousRecipe.title} to menu`
                                        }
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#ddcdb9] bg-white text-[#2f6f4e] transition hover:border-[#2f6f4e] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:text-[#9ca99f]"
                                      >
                                        <PlusIcon />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          removePreviousRecipe(previousRecipe.title)
                                        }
                                        aria-label={`Remove ${previousRecipe.title} from previously used`}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#ddcdb9] bg-white text-[#6d5e51] transition hover:border-[#8a5a22] hover:text-[#a33b24] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2"
                                      >
                                        <TrashIcon />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p className="rounded-md border border-dashed border-[#ddcdb9] bg-[#fffaf3] p-3 text-sm text-[#6d5e51]">
                        Recipes you add will appear here for quick reuse.
                      </p>
                    )}
                  </SourcePanel>
                </div>

                <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#ddcdb9] bg-white p-5 lg:h-[42rem] 2xl:h-auto">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#fffaf3] text-[#8a5a22]">
                          <MenuIcon />
                        </span>
                        <span>Menu</span>
                      </h2>
                      <p className="mt-1 text-sm text-[#6d5e51]">
                        Add recipes one at a time, then start the blended
                        cooking timeline.
                      </p>
                    </div>
                    {hasMenu ? (
                      <button
                        type="button"
                        onClick={() => setRecipeSourceOpen(false)}
                        className="inline-flex w-fit items-center justify-center rounded-md bg-[#2f6f4e] px-4 py-3 text-sm font-semibold leading-tight text-white shadow-sm transition hover:bg-[#285f43] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 focus:ring-offset-white"
                      >
                        Start cooking
                      </button>
                    ) : null}
                  </div>

                  {hasMenu ? (
                    <div className="mt-4 min-h-0 overflow-y-auto pr-1">
                      {menuSections.map(({ label, recipes }) =>
                        recipes.length > 0 ? (
                          <section key={label} className="mb-3 last:mb-0">
                            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                              {label}
                            </h3>
                            <ul className="grid gap-2">
                              {recipes.map((menuRecipe) => {
                                const scheduledRecipe = scheduledMenuRecipes.find(
                                  (recipeSchedule) =>
                                    recipeSchedule.id === menuRecipe.id,
                                );

                                return (
                                  <li
                                    key={menuRecipe.id}
                                    className="rounded-md border border-[#eadccc] bg-[#fffaf3] p-2"
                                  >
                                    <div className="flex items-stretch gap-2">
                                      <div
                                        className="flex w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white text-[#8a5a22]"
                                        style={
                                          menuRecipe.thumbnailUrl
                                            ? {
                                                backgroundImage: `url(${menuRecipe.thumbnailUrl})`,
                                                backgroundPosition: "center",
                                                backgroundSize: "cover",
                                              }
                                            : undefined
                                        }
                                      >
                                        {menuRecipe.thumbnailUrl ? null : (
                                          <LaneIcon lane="Serve" />
                                        )}
                                      </div>
                                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                                        <div className="min-w-0">
                                          <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                                  style={{
                                                    backgroundColor: menuRecipe.color,
                                                  }}
                                                  aria-hidden="true"
                                                />
                                                <p className="truncate font-serif text-base font-semibold italic leading-5 text-[#211b16]">
                                                  {menuRecipe.recipe.title}
                                                </p>
                                              </div>
                                              <p className="mt-0.5 text-xs text-[#6d5e51]">
                                                {getRecipeDurationLabel(
                                                  menuRecipe.recipe.tasks,
                                                )}
                                                {scheduledRecipe
                                                  ? `, starts at ${scheduledRecipe.startMinute} min`
                                                  : ""}
                                              </p>
                                              {menuRecipe.course === "Side Dish" ? (
                                                <p className="mt-1 inline-flex rounded-sm bg-white px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#8a5a22]">
                                                  Side dish
                                                </p>
                                              ) : null}
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                removeRecipeFromMenu(menuRecipe.id)
                                              }
                                              aria-label={`Remove ${menuRecipe.recipe.title}`}
                                              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#ddcdb9] text-[#6d5e51] transition hover:border-[#8a5a22] hover:text-[#a33b24] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2"
                                            >
                                              <TrashIcon />
                                            </button>
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap items-center justify-start gap-1.5 sm:justify-end">
                                          <select
                                            aria-label={`${menuRecipe.recipe.title} menu course`}
                                            value={menuRecipe.course}
                                            onChange={(event) =>
                                              updateMenuRecipeCourse(
                                                menuRecipe.id,
                                                event.target.value as MenuCourse,
                                              )
                                            }
                                            className="h-7 w-28 rounded-md border border-[#eadccc] bg-white px-2 text-xs font-semibold text-[#3e342d] outline-none transition focus:border-[#2f6f4e] focus:ring-2 focus:ring-[#2f6f4e]/20"
                                          >
                                            {menuCourses.map((menuCourse) => (
                                              <option
                                                key={menuCourse}
                                                value={menuCourse}
                                              >
                                                {menuCourse}
                                              </option>
                                            ))}
                                          </select>
                                          <label className="inline-flex h-7 items-center gap-1 rounded-md border border-[#eadccc] bg-white px-2">
                                            <span className="text-[#8a5a22]">
                                              <ServingsIcon />
                                            </span>
                                            <input
                                              aria-label={`${menuRecipe.recipe.title} servings`}
                                              type="number"
                                              min="1"
                                              value={
                                                menuRecipe.recipe.servings ?? ""
                                              }
                                              onChange={(event) =>
                                                updateMenuRecipeServings(
                                                  menuRecipe.id,
                                                  event.target.value
                                                    ? Number(event.target.value)
                                                    : null,
                                                )
                                              }
                                              className="h-6 w-10 rounded-sm border border-transparent bg-transparent px-1 text-xs font-semibold text-[#211b16] outline-none transition focus:border-[#2f6f4e] focus:ring-2 focus:ring-[#2f6f4e]/20"
                                            />
                                          </label>
                                          <label className="inline-flex h-7 items-center gap-1 rounded-md border border-[#eadccc] bg-white px-2">
                                            <span className="text-[#8a5a22]">
                                              <OffsetIcon />
                                            </span>
                                            <input
                                              aria-label={`${menuRecipe.recipe.title} serve after main minutes`}
                                              type="number"
                                              min="0"
                                              step="5"
                                              value={
                                                menuRecipe.serveOffsetMinutes
                                              }
                                              onChange={(event) =>
                                                updateMenuRecipeServeOffset(
                                                  menuRecipe.id,
                                                  Number(
                                                    event.target.value || 0,
                                                  ),
                                                )
                                              }
                                              className="h-6 w-10 rounded-sm border border-transparent bg-transparent px-1 text-xs font-semibold text-[#211b16] outline-none transition focus:border-[#2f6f4e] focus:ring-2 focus:ring-[#2f6f4e]/20"
                                            />
                                            <span className="text-xs text-[#6d5e51]">
                                              min
                                            </span>
                                          </label>
                                        </div>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </section>
                        ) : null,
                      )}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-md border border-dashed border-[#ddcdb9] bg-[#fffaf3] p-3 text-sm text-[#6d5e51]">
                      Add a photo or link recipe to start building the menu.
                    </p>
                  )}
                </div>
              </div>

            </>
          ) : null}
        </section>
        ) : null}

        {hasMenu ? (
        <section aria-labelledby="sample-timeline" className="space-y-6">
          <div>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="sample-timeline"
                  className="text-2xl font-semibold tracking-tight"
                >
                  Menu timeline
                </h2>
                <p className="mt-1 text-sm text-[#6d5e51]">
                  {menuRecipes
                    .map((menuRecipe) => menuRecipe.recipe.title)
                    .join(", ")}
                  , {totalMinutes} minutes
                </p>
              </div>
            </div>

            <div
              ref={cockpitRef}
              className={`${
                isCockpitFullscreen
                  ? "flex h-dvh flex-col gap-4 overflow-hidden bg-[#fffaf3] p-4 text-[#211b16]"
                  : "space-y-6"
              }`}
            >
            <div className={`${isCockpitFullscreen ? "hidden" : "mb-5 2xl:hidden"}`}>
              <MenuIngredientsPanel
                menuRecipes={menuRecipes}
                selectedRecipeId={selectedIngredientRecipeId}
                onSelectRecipe={setSelectedIngredientRecipeId}
              />
            </div>

            <div
              className={
                isCockpitFullscreen
                  ? "w-full shrink-0"
                  : "relative left-1/2 w-[calc(100vw-1rem)] -translate-x-1/2 px-6 sm:px-10 lg:px-12"
              }
            >
            <div className="rounded-lg border border-[#ddcdb9] bg-white">
              <div className="flex flex-col gap-2 border-b border-[#eadccc] px-3 py-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-xs text-[#6d5e51]">
                    Select a numbered task.
                  </span>
                  {laneLegend.map((item) => (
                    <div
                      key={item.label}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#ddcdb9] bg-white px-2 text-xs font-medium text-[#3e342d]"
                    >
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-sm ${item.className}`}
                      >
                        <LaneIcon lane={item.label} />
                      </span>
                      {item.label}
                    </div>
                  ))}
                  {scheduledMenuRecipes.map((menuRecipe) => (
                    <div
                      key={`timeline-recipe-${menuRecipe.id}`}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[#ddcdb9] bg-[#fffaf3] px-2 text-xs font-medium text-[#3e342d]"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: menuRecipe.color }}
                        aria-hidden="true"
                      />
                      {menuRecipe.recipe.title} ends {menuRecipe.endMinute} min
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-medium text-[#8a5a22]">
                    Timer: {formatTimer(elapsedSeconds)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setTimerRunning((running) => !running)}
                    className="inline-flex h-8 items-center justify-center rounded-md bg-[#2f6f4e] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#285f43] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 focus:ring-offset-white"
                  >
                    {timerRunning ? "Pause" : "Start"}
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#ddcdb9] bg-white px-3 text-xs font-semibold text-[#3e342d] transition hover:border-[#8a5a22] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 focus:ring-offset-white"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleCockpitFullscreen}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#ddcdb9] bg-white px-3 text-xs font-semibold text-[#3e342d] transition hover:border-[#8a5a22] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 focus:ring-offset-white"
                  >
                    {isCockpitFullscreen ? "Exit full screen" : "Full screen"}
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <div
                  className={isCockpitFullscreen ? "p-2" : "p-3"}
                  style={{ minWidth: `${timelineWidth}px` }}
                >
                  <div className="grid grid-cols-[7.5rem_minmax(0,1fr)]">
                    <div className="sticky left-0 z-50 border-r border-[#eee3d5] bg-white" />
                    <div className="relative h-7 text-xs font-semibold text-[#8a5a22]">
                      {minuteMarkers.map((minute) => (
                        <span
                          key={minute}
                          className="absolute top-0 whitespace-nowrap"
                          style={{
                            left: `${(minute / totalMinutes) * 100}%`,
                            transform: getEdgeAwareTransform(
                              minute,
                              totalMinutes,
                            ),
                          }}
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
                      {scheduledMenuRecipes.map((menuRecipe) => (
                        <span
                          key={`finish-${menuRecipe.id}`}
                          aria-hidden="true"
                          className="absolute bottom-0 top-0 w-1 rounded-full opacity-80"
                          style={{
                            left: `${(menuRecipe.endMinute / totalMinutes) * 100}%`,
                            backgroundColor: menuRecipe.color,
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
                        className="absolute -top-7 rounded bg-[#211b16] px-2 py-1 text-xs font-semibold text-white"
                        style={{
                          left: `${(currentMinute / totalMinutes) * 100}%`,
                          transform: getEdgeAwareTransform(
                            currentMinute,
                            totalMinutes,
                          ),
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
                          style={{
                            minHeight: getLaneHeight(
                              laneTasks,
                              isCockpitFullscreen,
                            ),
                          }}
                        >
                          <div className="sticky left-0 z-50 flex items-center gap-2 border-r border-[#eee3d5] bg-white pr-4 text-sm font-semibold text-[#3e342d] shadow-[8px_0_12px_-12px_rgba(33,27,22,0.8)]">
                            <LaneIcon lane={lane} />
                            {lane}
                          </div>
                          <div
                            className={`relative rounded bg-[#f8efe3] ${
                              isCockpitFullscreen ? "my-2" : "my-3"
                            }`}
                          >
                            {laneTasks.map((task) => {
                              const selected = task.id === selectedTask.id;
                              const expanded = task.id === expandedTaskId;
                              const completed = completedTaskIds.has(task.id);
                              const anchorToRight = shouldAnchorTaskToRight(
                                task,
                                totalMinutes,
                              );

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
                                  className={`group absolute flex items-center justify-center rounded-md text-xs font-semibold shadow-sm transition-[filter,box-shadow,min-width] hover:z-40 hover:min-w-max hover:px-2 focus:z-40 focus:min-w-max focus:px-2 focus:outline-none focus:ring-2 focus:ring-[#211b16] focus:ring-offset-2 ${
                                    task.recipeColor
                                      ? "text-white"
                                      : laneStyles[task.lane]
                                  } ${
                                    selected
                                      ? "ring-2 ring-[#211b16] ring-offset-2"
                                      : "hover:brightness-95"
                                  } ${
                                    expanded
                                      ? "z-40 min-w-max px-3"
                                      : "z-20 overflow-hidden"
                                  } ${
                                    completed ? "opacity-55 saturate-50" : ""
                                  } ${
                                    isCockpitFullscreen ? "h-7" : "h-9"
                                  } ${
                                    expanded ? "px-2" : "px-1.5"
                                  }`}
                                  style={{
                                    backgroundColor:
                                      task.recipeColor ?? undefined,
                                    left: anchorToRight
                                      ? undefined
                                      : getTaskLeft(task, totalMinutes),
                                    right: anchorToRight
                                      ? getTaskRight(task, totalMinutes)
                                      : undefined,
                                    top: isCockpitFullscreen
                                      ? `${0.35 + task.visualTrack * 2.1}rem`
                                      : `${0.5 + task.visualTrack * 2.75}rem`,
                                    width: `calc(${getTaskWidth(task, totalMinutes)} - 0.25rem)`,
                                  }}
                                  title={`${task.id}. ${task.instruction}`}
                                >
                                  {task.recipeColor ? (
                                    <span
                                      className="absolute bottom-1 left-1 top-1 w-1 rounded-full bg-white/80"
                                      aria-hidden="true"
                                    />
                                  ) : null}
                                  <span
                                    className={
                                      expanded
                                        ? "whitespace-nowrap"
                                        : "min-w-0 truncate group-hover:overflow-visible group-hover:text-clip group-hover:whitespace-nowrap group-focus:overflow-visible group-focus:text-clip group-focus:whitespace-nowrap"
                                    }
                                  >
                                    {expanded || task.durationMinutes >= 3
                                      ? getExpandedBlockLabel(task)
                                      : task.id}
                                    {completed ? " Done" : ""}
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

          <section
            className={`grid min-h-0 gap-6 ${
              isCockpitFullscreen
                ? "flex-1 grid-cols-[24rem_minmax(0,1fr)_24rem] items-stretch overflow-hidden"
                : "relative left-1/2 w-[calc(100vw-1rem)] -translate-x-1/2 px-6 sm:px-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-12 2xl:h-[calc(100dvh-34rem)] 2xl:min-h-[18rem] 2xl:grid-cols-[28rem_minmax(0,1fr)_26rem] 2xl:items-stretch 2xl:overflow-hidden"
            }`}
          >
            <div
              className={`min-h-0 ${
                isCockpitFullscreen ? "block" : "hidden 2xl:block"
              }`}
            >
              <MenuIngredientsPanel
                menuRecipes={menuRecipes}
                selectedRecipeId={selectedIngredientRecipeId}
                onSelectRecipe={setSelectedIngredientRecipeId}
                className="h-full"
                scrollable
              />
            </div>

            <aside className="min-h-0 rounded-lg border border-[#ddcdb9] bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                  Selected task
                </p>
                {selectedTask.recipeTitle ? (
                  <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[#ddcdb9] bg-[#fffaf3] px-3 text-xs font-semibold text-[#3e342d]">
                    <span
                      className="h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: selectedTask.recipeColor }}
                      aria-hidden="true"
                    />
                    {selectedTask.recipeTitle}
                  </span>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectPreviousStep}
                    disabled={!getPreviousStep(selectedTask.id)}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#ddcdb9] bg-white px-3 text-xs font-semibold text-[#3e342d] transition hover:border-[#8a5a22] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-[#e7d9c8] disabled:text-[#a99b8e]"
                  >
                    Previous Step
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleSelectedTaskDone}
                    className={`inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 ${
                      completedTaskIds.has(selectedTask.id)
                        ? "border border-[#ddcdb9] bg-white text-[#3e342d] hover:border-[#8a5a22]"
                        : "bg-[#2f6f4e] text-white hover:bg-[#285f43]"
                    }`}
                  >
                    {completedTaskIds.has(selectedTask.id)
                      ? "Mark Not Done"
                      : "Mark Done"}
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectNextStep}
                    disabled={!getNextStep(selectedTask.id)}
                    className="inline-flex h-8 items-center justify-center rounded-md border border-[#ddcdb9] bg-white px-3 text-xs font-semibold text-[#3e342d] transition hover:border-[#8a5a22] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-[#e7d9c8] disabled:text-[#a99b8e]"
                  >
                    Next Step
                  </button>
                  {completedTaskIds.has(selectedTask.id) ? (
                    <span className="rounded bg-[#eef7f0] px-2 py-1 text-xs font-semibold text-[#2f6f4e]">
                      Done
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold tracking-tight 2xl:text-3xl">
                    {selectedTask.id}. {selectedTask.shortLabel}
                  </h2>
                  <p className="mt-2 text-lg leading-8 text-[#3e342d] 2xl:text-xl">
                    {highlightIngredients(
                      selectedTask.instruction,
                      selectedTaskIngredients,
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="rounded-md bg-[#f8efe3] px-3 py-2 text-sm font-semibold text-[#8a5a22]">
                    {formatDuration(selectedTask)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${laneStyles[selectedTask.lane]}`}
                  >
                    <LaneIcon lane={selectedTask.lane} />
                    {selectedTask.lane}
                  </span>
                </div>
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
                    {getTaskStatus(
                      selectedTask,
                      currentMinute,
                      completedTaskIds,
                    )}
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

            <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[#ddcdb9] bg-white p-5">
              <h2 className="text-xl font-semibold tracking-tight">
                Steps
              </h2>
              <p className="mt-1 text-sm text-[#6d5e51]">
                Select any step to inspect or mark it done.
              </p>
              <ul className="mt-5 max-h-[30rem] min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 2xl:max-h-none">
                {orderedTasks.map((task) => {
                  const statusLabel = getTaskStatus(
                    task,
                    currentMinute,
                    completedTaskIds,
                  );
                  const completed = statusLabel === "Done";

                  return (
                    <TaskSummary
                      key={`step-${task.id}`}
                      task={task}
                      selected={task.id === selectedTask.id}
                      completed={completed}
                      statusLabel={statusLabel}
                      onSelect={setSelectedTaskId}
                    />
                  );
                })}
              </ul>
            </aside>
          </section>
            </div>
          </div>
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
