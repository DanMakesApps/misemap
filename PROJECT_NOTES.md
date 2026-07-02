# MiseMap Project Notes

## Current App Status

MiseMap is a simple Next.js, TypeScript, and Tailwind prototype. The homepage shows a hardcoded Tomato Pasta Bake sample as a horizontal cooking timeline with lanes for Prep, Hob, Oven, Passive, and Serve.

The timeline includes a current-time marker, compact numbered task blocks, selectable task details, a lane colour legend, and a Now / Next / Later panel.

## Intentionally Not Built Yet

The app does not yet include AI, real recipe upload handling, image processing, a database, authentication, user accounts, or a backend.

The “Upload recipe photo” button is still only a placeholder.

## Key Product Principles

MiseMap should help people understand what to do, when to do it, and what can happen in parallel while cooking.

The timeline should stay visual, scannable, and practical in the kitchen. Full instructions should be available without overcrowding the timeline itself.

The UI should eventually use standard icons for common lanes and actions, such as oven, grill, hob, mixing, chopping, resting, and serving, so tasks are easier to recognise at a glance.

Instruction steps should include ingredient amounts where relevant, so each task is actionable without forcing the cook to cross-reference the original recipe.

Users should be able to state how many people they are cooking for, and ingredient amounts should scale to suit that serving size.

The data model should stay flexible and should not assume every recipe starts at minute 0 of the main cooking session.

## Future Scheduling Notes

Later, MiseMap should support advance prep tasks such as soaking beans overnight, marinating for 24 hours, letting dough rise, or bringing ingredients to room temperature.

The app should eventually let users enter a serving time and work backwards from it. It should distinguish total elapsed recipe time, active cooking time, passive or waiting time, main cooking session start time, and advance prep reminders.

## Future Adaptive Timing Notes

Users should be able to pause the timer if they are running behind. The app should then recalculate the projected finishing time and shift remaining tasks relative to the pause or delay.

Users should be able to state their cooking proficiency. This should influence task durations, cooking start time, and buffer time. For example, chopping an onion may take a beginner 5 minutes but an expert much less time.

MiseMap should consider useful parallel tasks during passive time, such as setting the table while food rests or water boils, or cleaning specific cookware during gaps to reduce cleanup at the end.

The Now / Next / Later view should also make completed tasks visible, either in the same flow or through a Completed tab.
