# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__Claude_in_Chrome__*` tools.

## Available gstack skills

- `/office-hours` - Office hours
- `/plan-ceo-review` - Plan CEO review
- `/plan-eng-review` - Plan engineering review
- `/plan-design-review` - Plan design review
- `/design-consultation` - Design consultation
- `/review` - Code review
- `/ship` - Ship code
- `/land-and-deploy` - Land and deploy
- `/canary` - Canary deployment
- `/benchmark` - Benchmarking
- `/browse` - Web browsing (use this for ALL web browsing)
- `/qa` - Quality assurance
- `/qa-only` - QA only
- `/design-review` - Design review
- `/setup-browser-cookies` - Set up browser cookies
- `/setup-deploy` - Set up deployment
- `/retro` - Retrospective
- `/investigate` - Investigate issues
- `/document-release` - Document a release
- `/codex` - Codex
- `/cso` - CSO
- `/autoplan` - Auto-plan
- `/careful` - Careful mode
- `/freeze` - Freeze
- `/guard` - Guard
- `/unfreeze` - Unfreeze
- `/gstack-upgrade` - Upgrade gstack

## Markdown Preview

When asked to display or preview a `.md` file, always render it in Claude Code preview:
1. Convert the markdown to a self-contained HTML file (use `python3 -c "import markdown; ..."` or inline conversion)
2. Write a small `serve-preview.js` (Node) that serves the HTML on port 8888
3. Add a `newsletter-preview` entry to `.claude/launch.json` in the CWD
4. Start with `preview_start` and take a screenshot
5. Clean up the temp files after the preview server is stopped

## Claude Code Best Practices (Boris Cherny / Claude Code Team)

Source: https://x.com/bcherny/status/2017742741636321619

### 1. Parallelization

– Spin up 3–5 git worktrees, each running its own Claude session
– Name worktrees and set up shell aliases (za, zb, zc) to hop between them in one keystroke
– Consider a dedicated "analysis" worktree only for reading logs and running queries
– Use system notifications to know when a Claude session needs input

### 2. Plan Mode

– Start every complex task in plan mode
– Pour energy into the plan so Claude can one-shot the implementation
– When something goes sideways mid-task, switch BACK to plan mode and re-plan — don't push through
– Optional: spin up a second Claude to review the plan as "staff engineer" before executing

### 3. CLAUDE.md as compounding engineering

– After every correction, end with: "Update your CLAUDE.md so you don't make that mistake again."
– Claude is good at writing rules for itself — let it
– Ruthlessly edit CLAUDE.md over time until Claude's mistake rate measurably drops
– Consider a notes directory per task, updated after every PR, with CLAUDE.md pointing at it

### 4. Skills and slash commands

– If you do something more than once a day, turn it into a skill or slash command
– Check skills into git so teammates inherit them immediately
– Examples from the team:
  – `/techdebt` — find and kill duplicated code at end of every session
  – Context dump — slash command that syncs 7 days of Slack, GDrive, Asana, GitHub into one context
  – Analytics agents — write dbt models, review code, test changes in dev

### 5. Let Claude fix bugs autonomously

– Paste a Slack bug thread into Claude and say "fix." Don't micromanage how.
– Say "Go fix the failing CI tests." — give the problem, not the solution
– Point Claude at docker logs to troubleshoot distributed systems

### 6. Prompting techniques

– Challenge Claude: "Grill me on these changes and don't make a PR until I pass your test."
– After a mediocre fix: "Knowing everything you know now, scrap this and implement the elegant solution."
– "Prove to me this works" — have Claude diff behavior between main and your feature branch
– Write detailed specs and reduce ambiguity before handing work off — the more specific, the better

### 7. Terminal and environment

– Use /statusline to show context usage and git branch at all times
– Color-code terminal tabs, one per worktree/task
– Use voice dictation — you speak 3x faster than you type, prompts get more detailed (fn x2 on macOS)
– Team recommendation: Ghostty terminal (synchronized rendering, 24-bit color, proper unicode)

### 8. Subagents

– Append "use subagents" to any request where you want Claude to throw more compute at it
– Offload individual tasks to subagents to keep your main agent's context window clean
– Route permission requests to Opus via a hook — let it scan for attacks and auto-approve safe ones (see code.claude.com/docs)

### 9. Data and analytics via CLI

– Use Claude with database CLIs (bq, psql, sqlite3) to pull and analyze metrics directly
– Check a database skill into the codebase so the whole team can use it
– This works for any database with a CLI, MCP, or API
– Benefit: stay in one context while Claude handles the SQL translation layer

### 10. Learning mode

– Enable "Explanatory" or "Learning" output style in /config to have Claude explain the why behind changes
– Have Claude generate visual HTML presentations explaining unfamiliar code
– Ask for ASCII diagrams of protocols and codebases
– Build a spaced-repetition learning skill: explain your understanding, Claude asks follow-ups, stores gaps

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
