"use client";

import { useState } from "react";

type Lane = "Prep" | "Hob" | "Oven" | "Passive" | "Serve";

type TimelineTask = {
  id: number;
  lane: Lane;
  startMinute: number;
  durationMinutes: number;
  instruction: string;
  shortLabel: string;
  track?: number;
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
  },
  {
    id: 2,
    lane: "Prep",
    startMinute: 0,
    durationMinutes: 8,
    instruction: "Chop onion, garlic, and carrot",
    shortLabel: "Chop veg",
  },
  {
    id: 3,
    lane: "Hob",
    startMinute: 0,
    durationMinutes: 12,
    instruction: "Bring salted pasta water to the boil",
    shortLabel: "Boil water",
  },
  {
    id: 4,
    lane: "Hob",
    startMinute: 8,
    durationMinutes: 6,
    instruction: "Saut\u00e9 onion and carrot",
    shortLabel: "Saut\u00e9 veg",
    track: 1,
  },
  {
    id: 5,
    lane: "Hob",
    startMinute: 14,
    durationMinutes: 1,
    instruction: "Add garlic",
    shortLabel: "Garlic",
    track: 1,
  },
  {
    id: 6,
    lane: "Hob",
    startMinute: 15,
    durationMinutes: 18,
    instruction: "Simmer tomato sauce",
    shortLabel: "Simmer sauce",
  },
  {
    id: 7,
    lane: "Hob",
    startMinute: 20,
    durationMinutes: 10,
    instruction: "Cook pasta",
    shortLabel: "Cook pasta",
    track: 1,
  },
  {
    id: 8,
    lane: "Prep",
    startMinute: 30,
    durationMinutes: 5,
    instruction: "Drain pasta and mix with sauce",
    shortLabel: "Mix pasta",
  },
  {
    id: 9,
    lane: "Prep",
    startMinute: 35,
    durationMinutes: 3,
    instruction: "Transfer to baking dish and add cheese",
    shortLabel: "Add cheese",
  },
  {
    id: 10,
    lane: "Oven",
    startMinute: 38,
    durationMinutes: 15,
    instruction: "Bake pasta",
    shortLabel: "Bake",
  },
  {
    id: 11,
    lane: "Passive",
    startMinute: 53,
    durationMinutes: 5,
    instruction: "Rest",
    shortLabel: "Rest",
  },
  {
    id: 12,
    lane: "Serve",
    startMinute: 58,
    durationMinutes: 2,
    instruction: "Add herbs and serve",
    shortLabel: "Serve",
  },
];

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

const activeTasks = tasks.filter(
  (task) =>
    task.startMinute <= currentMinute &&
    currentMinute < task.startMinute + task.durationMinutes,
);
const upcomingTasks = tasks
  .filter((task) => task.startMinute >= currentMinute)
  .sort(
    (a, b) =>
      a.startMinute - b.startMinute || a.durationMinutes - b.durationMinutes,
  );
const nextTask = upcomingTasks[0];
const laterTasks = upcomingTasks.slice(1);

function formatMinuteRange(task: TimelineTask) {
  return `${task.startMinute}-${task.startMinute + task.durationMinutes} min`;
}

function getTaskWidth(task: TimelineTask) {
  return `${(task.durationMinutes / totalMinutes) * 100}%`;
}

function getTaskLeft(task: TimelineTask) {
  return `${(task.startMinute / totalMinutes) * 100}%`;
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

function getWorkMode(task: TimelineTask) {
  return task.lane === "Passive" ? "Passive" : "Active";
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

export default function Home() {
  const [selectedTaskId, setSelectedTaskId] = useState(activeTasks[0].id);
  const [hoveredTaskId, setHoveredTaskId] = useState<number | null>(null);
  const selectedTask =
    tasks.find((task) => task.id === selectedTaskId) ?? activeTasks[0];
  const expandedTaskId = hoveredTaskId ?? selectedTask.id;

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
          <button
            type="button"
            className="inline-flex h-12 w-fit items-center justify-center rounded-md bg-[#2f6f4e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#285f43] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 focus:ring-offset-[#fffaf3]"
          >
            Upload recipe photo
          </button>
        </header>

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
                  Tomato Pasta Bake, 60 minutes
                </p>
              </div>
              <p className="text-sm font-medium text-[#8a5a22]">
                Current minute: {currentMinute}
              </p>
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

                    {lanes.map((lane) => (
                      <div
                        key={lane}
                        className="grid min-h-28 grid-cols-[7.5rem_minmax(0,1fr)] border-t border-[#eee3d5]"
                      >
                        <div className="sticky left-0 z-50 flex items-center border-r border-[#eee3d5] bg-white pr-4 text-sm font-semibold text-[#3e342d] shadow-[8px_0_12px_-12px_rgba(33,27,22,0.8)]">
                          {lane}
                        </div>
                        <div className="relative my-3 rounded bg-[#f8efe3]">
                          {tasks
                            .filter((task) => task.lane === lane)
                            .map((task) => {
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
                                    top: `${0.5 + (task.track ?? 0) * 2.5}rem`,
                                    width: getTaskWidth(task),
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
                    ))}
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
                    {getWorkMode(selectedTask)}
                  </dd>
                </div>
              </dl>
            </aside>

            <aside className="rounded-lg border border-[#ddcdb9] bg-white p-5">
              <h2 className="text-xl font-semibold tracking-tight">
                Now / Next / Later
              </h2>
              <div className="mt-5 space-y-5">
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                    Now
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {activeTasks.map((task) => (
                      <TaskSummary
                        key={`now-${task.id}`}
                        task={task}
                        selected={task.id === selectedTask.id}
                        onSelect={setSelectedTaskId}
                      />
                    ))}
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
      </section>
    </main>
  );
}
