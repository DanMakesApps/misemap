export default function Home() {
  const steps = [
    { time: "0:00", task: "Prep ingredients and preheat the oven" },
    { time: "0:15", task: "Start the longest cooking step" },
    { time: "0:35", task: "Coordinate sides, sauces, and finishing touches" },
    { time: "0:50", task: "Plate while everything is hot" },
  ];

  return (
    <main className="min-h-screen bg-[#fffaf3] text-[#211b16]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10 lg:px-12">
        <div className="flex flex-1 flex-col justify-center gap-14">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.18em] text-[#8a5a22]">
              MiseMap
            </p>
            <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
              MiseMap
            </h1>
            <p className="mt-5 max-w-xl text-xl leading-8 text-[#5f5146]">
              Turn recipes into cooking timelines
            </p>
            <button
              type="button"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[#2f6f4e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#285f43] focus:outline-none focus:ring-2 focus:ring-[#2f6f4e] focus:ring-offset-2 focus:ring-offset-[#fffaf3]"
            >
              Upload recipe photo
            </button>
          </div>

          <section aria-labelledby="sample-timeline" className="max-w-2xl">
            <h2
              id="sample-timeline"
              className="text-2xl font-semibold tracking-tight"
            >
              Sample timeline
            </h2>
            <ol className="mt-5 space-y-4 border-l border-[#d8c8b6] pl-5">
              {steps.map((step) => (
                <li key={step.time} className="relative">
                  <span className="absolute -left-[1.68rem] top-1.5 h-3 w-3 rounded-full bg-[#2f6f4e]" />
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
                    <time className="font-mono text-sm font-semibold text-[#8a5a22]">
                      {step.time}
                    </time>
                    <p className="text-base text-[#3e342d]">{step.task}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </section>
      </main>
  );
}
