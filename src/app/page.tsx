type Lane = "Prep" | "Hob" | "Oven" | "Passive" | "Serve";

type TimelineTask = {
  lane: Lane;
  startMinute: number;
  durationMinutes: number;
  title: string;
  track?: number;
};

const currentMinute = 18;
const totalMinutes = 60;
const lanes: Lane[] = ["Prep", "Hob", "Oven", "Passive", "Serve"];
const minuteMarkers = [0, 15, 30, 45, 60];

const tasks: TimelineTask[] = [
  {
    lane: "Oven",
    startMinute: 0,
    durationMinutes: 10,
    title: "Preheat oven to 180\u00b0C",
  },
  {
    lane: "Prep",
    startMinute: 0,
    durationMinutes: 8,
    title: "Chop onion, garlic, and carrot",
  },
  {
    lane: "Hob",
    startMinute: 0,
    durationMinutes: 12,
    title: "Bring salted pasta water to the boil",
  },
  {
    lane: "Hob",
    startMinute: 8,
    durationMinutes: 6,
    title: "Saut\u00e9 onion and carrot",
    track: 1,
  },
  {
    lane: "Hob",
    startMinute: 14,
    durationMinutes: 1,
    title: "Add garlic",
    track: 1,
  },
  {
    lane: "Hob",
    startMinute: 15,
    durationMinutes: 18,
    title: "Simmer tomato sauce",
  },
  {
    lane: "Hob",
    startMinute: 20,
    durationMinutes: 10,
    title: "Cook pasta",
    track: 1,
  },
  {
    lane: "Prep",
    startMinute: 30,
    durationMinutes: 5,
    title: "Drain pasta and mix with sauce",
  },
  {
    lane: "Prep",
    startMinute: 35,
    durationMinutes: 3,
    title: "Transfer to baking dish and add cheese",
  },
  { lane: "Oven", startMinute: 38, durationMinutes: 15, title: "Bake pasta" },
  { lane: "Passive", startMinute: 53, durationMinutes: 5, title: "Rest" },
  {
    lane: "Serve",
    startMinute: 58,
    durationMinutes: 2,
    title: "Add herbs and serve",
  },
];

const laneStyles: Record<Lane, string> = {
  Prep: "bg-[#2f6f4e] text-white",
  Hob: "bg-[#b85428] text-white",
  Oven: "bg-[#7b4f9d] text-white",
  Passive: "bg-[#6b7280] text-white",
  Serve: "bg-[#1f6f8b] text-white",
};

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

function TaskSummary({ task }: { task: TimelineTask }) {
  return (
    <li className="rounded-md border border-[#ddcdb9] bg-white px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-[#211b16]">
          {task.title}
        </span>
        <span className="shrink-0 text-xs font-medium text-[#8a5a22]">
          {formatMinuteRange(task)}
        </span>
      </div>
      <p className="mt-1 text-xs text-[#6d5e51]">{task.lane}</p>
    </li>
  );
}

export default function Home() {
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

        <section
          aria-labelledby="sample-timeline"
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"
        >
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

            <div className="overflow-x-auto rounded-lg border border-[#ddcdb9] bg-white">
              <div className="min-w-[920px] p-4">
                <div className="grid grid-cols-[6rem_minmax(0,1fr)]">
                  <div />
                  <div className="relative h-7 text-xs font-medium text-[#8a5a22]">
                    {minuteMarkers.map((minute) => (
                      <span
                        key={minute}
                        className="absolute top-0 -translate-x-1/2"
                        style={{ left: `${(minute / totalMinutes) * 100}%` }}
                      >
                        {minute}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute bottom-0 left-24 right-0 top-0 z-10">
                    {minuteMarkers.map((minute) => (
                      <span
                        key={`grid-${minute}`}
                        aria-hidden="true"
                        className="absolute bottom-0 top-0 w-px bg-[#eadccc]"
                        style={{ left: `${(minute / totalMinutes) * 100}%` }}
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
                      className="grid min-h-24 grid-cols-[6rem_minmax(0,1fr)] border-t border-[#eee3d5]"
                    >
                      <div className="flex items-center pr-4 text-sm font-semibold text-[#3e342d]">
                        {lane}
                      </div>
                      <div className="relative my-3 rounded bg-[#f8efe3]">
                        {tasks
                          .filter((task) => task.lane === lane)
                          .map((task) => (
                            <div
                              key={`${task.lane}-${task.startMinute}-${task.title}`}
                              className={`absolute flex h-9 items-center overflow-hidden rounded-md px-3 text-xs font-semibold shadow-sm ${laneStyles[task.lane]}`}
                              style={{
                                left: `${(task.startMinute / totalMinutes) * 100}%`,
                                top: `${0.5 + (task.track ?? 0) * 2.5}rem`,
                                width: `${(task.durationMinutes / totalMinutes) * 100}%`,
                              }}
                              title={`${task.startMinute}-${
                                task.startMinute + task.durationMinutes
                              } ${task.lane}: ${task.title}`}
                            >
                              <span className="truncate">{task.title}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

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
                    <TaskSummary key={`now-${task.title}`} task={task} />
                  ))}
                </ul>
              </section>

              {nextTask ? (
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                    Next
                  </h3>
                  <ul className="mt-2 space-y-2">
                    <TaskSummary task={nextTask} />
                  </ul>
                </section>
              ) : null}

              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a5a22]">
                  Later
                </h3>
                <ul className="mt-2 space-y-2">
                  {laterTasks.map((task) => (
                    <TaskSummary key={`later-${task.title}`} task={task} />
                  ))}
                </ul>
              </section>
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}
