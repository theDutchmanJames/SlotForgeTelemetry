# Remake inventory (after 0.14.0)

Which screens were built "to work" and would do well with a **remake**, not just a restyle. A remake rethinks what the
screen is for, its flow and its features, and suggests missing features (each one is approved before it is added). A
**redesign** keeps the function and only changes the look. Every remake starts with a preview with two options to choose from
(`docs/ui-reference/remake-2026-11/`).

Verdicts: **Remake** · **Rework** (a smaller remake of one part) · **Fine**.
Judged from full-page pictures of every page with the example data (dark, 1424 px), plus the code.

## The big picture first

The six tabs grew one feature at a time, so the same thing lives in several places:

| Thing | Where it is today |
|---|---|
| Laps you drove | Track day (logging), Analyze › Laps, Analyze › Progress, Analyze › Records, Library › Race results, Garage (best laps) |
| Comparing | Analyze › Compare (setups), Analyze › Track laps › Compare (runs), Track day (last run), Progress (reference run) |
| A setup's results | Workbench (live results), Analyze › Analysis (saved version), Library (selected setup card) |
| Paddock | Settings › Connect to Paddock, Analyze (button), Library › Race results (button), Garage (text) |

Two menus called "Compare", "Analysis" inside "Analyze", and a car's history spread over four pages. The order of the remakes
below starts with the places where this hurts most.

## Tier 1: the biggest wins

### 1. Track laps: Laps, Progress, Records, Race results · Remake · **Done ("Pace Wall")**
One Laps page: cars, track and lane, a scoreboard, every lap of every run as a wall, what moved the pace, the selected run with a note and a kind. Still open from this item: hide or delete a single lap of a typed-in run from the wall, and the full lap analysis page in the new look.
- One run is spread over **Analyze › Laps** (one run in detail), **Progress** (runs over time), **Records** (best laps) and
  **Library › Race results** (the list of runs, with Edit and Delete). Each page has its own filter bar and its own picker.
- Laps is a 2000 px page: three stat cards, a chart, two more stat cards, "What this run shows" (three text boxes saying the
  stat cards again), stint table, laps, classification. The run is picked from a long drop-down
  ("Club GT · Club night · 16 Oct 2026, 21:30 · Lane 1 · Alex").
- Progress picks a group from a drop-down, then a run and a reference from two more drop-downs, and explains itself in five
  paragraphs ("does not establish a setup effect", "not tested for statistical significance").
- Records is one table of two rows, on its own page.
- **Ideas:** one place for every run: a list of runs grouped by car, track and lane, with the pace trend on top and the
  record marked; a run opens as a sheet (chart, stints, laps, what was raced). Progress becomes the trend of a group, Records
  a badge. Missing: notes on a run, a tag (club night, test, race), delete/hide a lap on manual runs, a "best 5 in a row"
  on the chart.

### 2. Analyze for setups: Analysis and Compare · Remake
- **Analysis** shows a saved setup's numbers again, the same results the workbench shows live, behind a picker and a left
  menu of 8 topics. "Edit these inputs" and "Edit in Telemetry" both leave the page.
- **Compare** is a 20-row table where 13 rows say "Unavailable". The changes (pinion 9 → 10) are not listed; you read them
  from the numbers.
- **Ideas:** a "what changed" first comparison (the inputs that differ, then the results that move), two or three setups
  side by side, a "compare with the workbench" choice so you don't need to save first; Analysis folds into the workbench
  (it is the same page for a saved setup).

### 3. Library: Saved setups and Garage · Remake
- Saved setups is a table of name, gearing, tyres and weight, with a detail card whose picture is a generic chassis and
  wheels. 8 buttons on the card. Setups are not grouped by car, although every setup has a car.
- The Garage has car tiles with an empty grey picture and a wheel icon, "2 setup(s) · 7 run(s)", and a "TELEMETRY" tag on
  every card. Tracks are a separate table. Paddock cars and own cars look the same.
- **Ideas:** the car is the way in: a garage of cars, each with its setups (versions over time), its runs and its best lap;
  a setup's history (what changed between versions); track pages with lane lengths and records. Car photos from Paddock.

### 4. Track day · Remake
- Car, track, lane and driver are four free text fields. The setup card on the left copies the workbench. "Log a run" is a
  big empty text box, "Compare with last run" is the best part, but sits on the right.
- No timer: you type or paste lap times. No session idea: "Today's runs" is whatever was saved today.
- **Ideas:** a session (car + track + lane, chosen from the garage) with a run board: each run a column with its change,
  best and typical pace, the better one marked; the change picked from the setup fields (pinion 9 → 10) instead of typed;
  a quick lap entry (one box per lap, or paste); "keep this change" back to the workbench.

## Tier 2: rework one part

| Screen | What to rework | Ideas |
|---|---|---|
| Driver Feedback | A 5-step wizard whose first step is two drop-downs and three folded sections; lots of explaining ("Start with an observation, not a specification sheet"). | Symptom cards with a picture (where in the corner, what the car does) instead of drop-downs; the checks as a to-do list with "it helped / no change" |
| Workbench lower part | The input folders and live results folders are two parallel lists with Pin buttons; the "Ready to look deeper?" and "How does your car behave?" cards are adverts for other pages. | Inputs and their result next to each other; remove the adverts once Analysis folds in (#2) |
| Settings › Connect to Paddock | Two ways in (this computer, network) with a numbered how-to, address and password fields and four buttons. | One status card with one "Connect" action; the network way behind "Another computer" |
| Settings › Calculations explained | A long text page, reached from Settings only. | A "?" next to each result opening its explanation |
| Setup sheet | Print view only. | Fine for now, check after #3 |

## Fine as they are
Settings › Appearance, Units, Backups and Updates (just redone), the top bar (just redone), the workbench setup bar (just
redone), the gear chart.

## Suggested order
1. Track laps (#1), 2. Analyze for setups (#2), 3. Library and Garage (#3), 4. Track day (#4), then the Tier 2 reworks.
#1 and #2 together decide what the Analyze tab becomes, so the top bar may change after them.
