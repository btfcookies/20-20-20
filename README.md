# 20-20-20

A single-page timer for the 20-20-20 eye strain rule: every 20 minutes, look at
something 20 feet away for 20 seconds.

- Auto-starts a 20-minute focus countdown on load.
- Plays a chime and shows **Start Break** when it ends.
- Runs a 20-second break countdown, telling you to look 20 feet away.
- Plays a chime and shows **Finish Break** when it ends.
- Clicking **Finish Break** starts the next 20-minute cycle automatically.

State survives page refresh via `localStorage`. No build step — open
`index.html` directly.

## Note on sound

The chime uses the Web Audio API and browsers block audio until the page has
had a user gesture (a click or keypress). Since the first focus timer starts
automatically, click anywhere on the tab at least once in the first 20
minutes to make sure the chime is unlocked in time.
