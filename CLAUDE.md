# CLAUDE.md — Toolbox

AI Dungeon script suite ("Toolbox v2.0" by FaraC), with the vendored Inner Self replaced
by Zoocata1's KV cache-compatible build (https://github.com/Zoocata1/KV-Inner-Self) so it
runs on AI Dungeon's Optimized Context. AID only consumes four files, so
everything the runtime needs must live in them:

- `Library.js` — shared code, **~12.5K lines** (see composition below).
- `Input.js`, `Context.js`, `Output.js` — thin hooks; each just calls a `handleToolbox*`
  function from `Library.js` and returns `{ text }` (Context also returns `stop`).

There is **no module system and no build step** — every symbol is a top-level global
`function`/`const`. The deployed artifact is `Library.js` verbatim.

## Working on `Library.js` — read this before opening it

`Library.js` is ~622 KB (~150K tokens). **Never read it whole** — it will blow the context
window. It is not really one file; it is **~4K lines of our code + two vendored third-party
scripts** pasted in at the end:

| Block | Location | Owner |
|---|---|---|
| **Our Toolbox code** | top of file down to `function InnerSelf(hook)` (~first 4K lines) | We develop this |
| `InnerSelf(hook)` | from `function InnerSelf(hook) {` (~line 3998), ~2.7K lines | **Vendored (KV build v1.0.2-kv1) — do not edit** |
| `AutoCards(inHook, inText, inStop)` | from `function AutoCards(...) {` (~line 6701) to EOF, ~6K lines | **Vendored (+1-line KV rawText fix) — do not edit** |

The two vendored blocks are self-contained black boxes:
- `InnerSelf` is called only as `InnerSelf("input"|"context"|"output")` (3 call sites).
- `AutoCards` is called only as `AutoCards(hook, text, stop)`.
- Neither references our globals. **Almost no task requires reading or editing them.**
  To upgrade one, replace the whole function body from an upstream paste — don't diff-surgery it.
  InnerSelf's upstream is the KV build (https://github.com/Zoocata1/KV-Inner-Self), NOT stock
  Inner Self — a stock paste would break Optimized Context again. Two local deltas to re-apply
  on any upgrade: the "Note on Toolbox integration" config-card message inside InnerSelf, and
  the `action?.rawText` fallback line inside AutoCards. Keep `// @cache-compatible` as the
  first line of `Context.js`.

These are **rigorously tested third-party scripts, not our code**, and almost never the source
of a bug. When **troubleshooting or doing ongoing development, treat them as out of scope** — the
cause is virtually always in our ~4K lines, so look there first and don't go spelunking in the
vendored blocks. Their only real value to us is as a **reference when building a new feature**
(e.g. seeing how they handle an AID hook or a story-card operation). Outside that, ignore them.

(Line numbers above drift as our code changes. Anchor on the **function signatures**, which are
stable — `InnerSelf` and `AutoCards` are the last two top-level functions in the file.)

## Navigation workflow (do this instead of reading the file)

1. **Get the table of contents** — always current, zero maintenance:
   ```
   grep -nE "^(function|const|class) " Library.js
   ```
   Everything at/after `function InnerSelf` is vendored; ignore it unless the task is
   explicitly about InnerSelf/AutoCards.

2. **Find a specific symbol's current line:** `grep -n "function targetName" Library.js`

3. **Read only what you need** with Read `offset`/`limit` around that line — not the whole file.

4. **Edit in place** with Edit. To add a new function, place it near related ones (grep for a
   sibling first) so the file stays sectioned; never append past `function InnerSelf`.

Doing this keeps a routine edit at a few hundred lines of context instead of 12.5K.

## Future option (not yet done)

If context cost is still a problem, the durable fix is to split `src/` into modules +
`vendor/innerself.js` + `vendor/autocards.js` and add a ~15-line concat build that joins them in
order into `Library.js`. Safe because functions hoist and all top-level `const`s finish before
any hook runs, so preserving current order yields a byte-identical file. Extracting just the two
vendored blocks removes ~60% of the file from AI context. Ask before undertaking this.
