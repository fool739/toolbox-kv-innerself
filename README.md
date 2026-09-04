# Toolbox + KV-Optimized Inner Self

An AI Dungeon script suite combining **[Toolbox v2.0](https://github.com/blanchelyan/Toolbox)** (by FaraC) with the **[KV cache-compatible build of Inner Self](https://github.com/Zoocata1/KV-Inner-Self)** (LewdLeah's Inner Self, modified by Zoocata1 to run on AI Dungeon's Optimized Context / KV-cached models).

## Why this exists

The original Toolbox bundles the stock Inner Self v1.0.2. Stock Inner Self rewrites the assembled context on every turn, which breaks on models using **Optimized Context** (KV caching). This repo swaps the bundled Inner Self for the KV build (`v1.0.2-kv1`), which treats the incoming context as an immutable cached prefix and only appends a compact dynamic suffix after it. The KV build's Auto-Cards `rawText` fallback fix is applied as well.

Everything else — all Toolbox tools, commands, configuration cards, and passive features — is unchanged from upstream Toolbox.

### What changed vs. upstream Toolbox

- `Library.js`: the vendored `InnerSelf(hook)` block is replaced with the KV-Inner-Self version (`v1.0.2-kv1`). Toolbox's config-card note about Toolbox/Inner Self integration is preserved (shortened so the config card entry stays under AID's 1000-char editor limit).
- `Library.js`: one-line KV fix in the vendored `AutoCards` block (`action?.rawText` fallback when reading history actions).
- `Context.js`: now starts with the `// @cache-compatible` marker required for Optimized Context support.
- `/protagonist` + Inner Self fixes (Toolbox's `changeInnerSelfPC`, plus one guard in the vendored block):
  - Swapping into an NPC who has a brain card now retires that card's agent metadata (memories kept), so Inner Self's config sync can't silently re-add the new PC to the agent list, where their name would win the trigger scan on most turns and starve real NPCs of thought formation. Swapping away again revives the retired brain.
  - When the previous protagonist was the unset placeholder, the swap no longer writes a literal "protagonist" ghost agent into the NPC list.
  - Inner Self's agent list now always excludes the configured player character.

### Caveat

Toolbox's own passive features (floating Prompt story cards, scene contracts, context filtering) still modify the context above the "Recent Story:" marker. On Optimized Context models this works correctly, but turns where that injected block changes will get fewer cache hits than a pure KV-Inner-Self scenario. Inner Self itself is fully cache-friendly.

## Install Guide for Scenarios

1. Use the [AI Dungeon website](https://aidungeon.com/) on PC (or view as desktop if mobile-only)
2. [Create a new scenario](https://help.aidungeon.com/faq/what-are-scenarios) or edit an existing scenario
3. Open the `DETAILS` tab, toggle ON `Scripts Enabled` under `Scripting`, then select `EDIT SCRIPTS`
4. Copy the contents of each file in this repo into the matching script tab, replacing whatever is there:
   - [`Input.js`](./Input.js) → `Input` tab
   - [`Context.js`](./Context.js) → `Context` tab (the `// @cache-compatible` first line matters — keep it)
   - [`Output.js`](./Output.js) → `Output` tab
   - [`Library.js`](./Library.js) → `Library` tab
5. Click `SAVE`

---

# 🧰 Toolbox v2.0 Operation Manual 🧰

🌍 Overview
> Toolbox has active and passive features.
> The active features, tools, only do something when the player enters a command.
> The passive features include inserting Prompt story cards into the context, maintaining configurations, and filtering/cleaning text.

🛠️ Tools
> Each tool is activated by a command entered by the player into Do or Say.
> Commands are made up of a forward slash followed by a word or its single-letter shortened variant, e.g., "/cyoa" or "/y"
> Commands accept arguments that modify the function of the tool. For example, "/cyoa Emily" will tell the AI to produce CYOA options related to Emily instead of defaulting to options related to the protagonist.

🛣️ Choose Your Own Adventure (CYOA)
> Creates a set of four possible next events options for the story. By default, these will mostly be actions taken by the protagonist, but using the focus argument can shift them to actions by other characters or other event types.
> After generating options, enter /a, /b, /c, or /d to select one and continue the story accordingly.
> Only the chosen option is visible to the AI.
- /cyoa [focus] or /y [focus]
- Examples: "/cyoa", "/cyoa Emily"
- Default focus: the protagonist

📷 Snapshot
> Creates a detailed visiual description of the scene, as it would be seen by a neutral observer set the chosen distance away from the chosen focus.
> To select a distance, the first argument must be a number 0-4. These get converted into text as below.
> By default, the entire Snapshot output is hidden from the AI to avoid overly influencing the story. This can be changed in the Toolbox Configuration story card, but the change is not retroactive.
- /snapshot [distance] [focus] or /s [distance] [focus]
- Examples: "/snapshot", "/snapshot 2", "/snapshot Emily", "/snapshot 2 Emily"
- Default distance: 3 (mid-range) - default focus: the protagonist
- Distance number to distance text conversion: [0: "internal", 1: "extremely close", 2: "nearby", 3: "mid-range", 4: "bird's eye"]

💭 Mindview
> Provides a detailed depiction of the subject's mind, focusing on a specific sense.
> Other aspects of mental activity are also available.
> By default, the entire Mindview output is hidden from the AI to avoid overly influencing the story. This can be changed in the Toolbox Configuration story card, but the change is not retroactive.
- /mindview [sense] [subject] or /m [sense] [subject]
- Examples: "/mindview", "/mindview hearing", "/mindview Emily", "/mindview hearing Emily"
- Default sense: thought - default subject: the protagonist
- Available senses: ["thought", "emotion", "feeling", "sight", "hearing", "smell", "touch", "taste"]

⏩ Fast Forward
> Moves the story forward to the provided destination (which can be a location or an event).
> Creates a summary of what happens between now and then.
> All aspects of Fast Forward are visible to the AI except the input line.
- /fast [destination] or /forward [destination] or /f [destination]
- Examples: "/fast", "/fast Emily arrives at the party"
- Default destination: the next scene

🔁 Protagonist Swap
> Switches the story's current protagonist with the name provided as an argument.
> Use the new protagonist's proper name, matching the name used in story cards (if any).
> Changes the name listed in the Toolbox Configuration story card.
> Changes the names listed in the Inner Self Configuration story card.
> Changes the names listed in the Overview prompt story card (if present).
> Changes the name used for default arguments and floating prompts.
- /protagonist [new protagonist] or /swap [new protagonist] or /p [new protagonist]
- Examples: "/protagonist Emily"
- WARNING: the new protagonist argument is required. There is no default. You will get an error if you use this command without an argument.

👋 Introduce Character
> Introduces a brand-new character in the middle of an adventure by creating a blank character Prompt story card for them.
> The card uses the same format as any character card created during scenario generation, but the Appearance, Voice, and Nonverbal example fields start as bracketed instructions rather than finished prose. The AI fills them in on demand once the card is assembled into the floating prompt.
> This is equivalent to adding the character during generation and copying them over as JSON, except it happens mid-story for a character who did not exist before.
> Nothing is generated and the story does not advance — the turn simply creates the card.
- /intro [name] or /introduce [name]
- Examples: "/intro Ellen", "/intro Mary Jane"
- WARNING: the name argument is required. There is no default. You will get an error if you use this command without an argument.
- You will also get an error if a character card with that name already exists.

🎬 Autoscene
> A toggle for scenes with many characters present at once.
> While active, every turn the script scans the last several actions for mentions of your character cards' names, scores them by how often and how recently they appear, and automatically injects the top 2-3 as a scene contract — a hands-free, script-powered version of AID's native keyword-triggered story cards.
> The protagonist is never auto-injected (they already have their own dedicated block). If no character is mentioned in the recent window, nothing is injected that turn.
> Autoscene and the manual scene commands (/scened, /scenei, /scenec, /combat, /explore) are mutually exclusive: turning autoscene on clears any active scene contract, and using any manual scene command turns autoscene off. /sceneclear turns everything off.
- /autoscene or /auto
- Examples: "/autoscene" to turn it on, "/autoscene" again to turn it off
- Tunable in the Configure Toolbox card: Autoscene Character Limit (default 3) caps how many characters are injected per turn; Autoscene Lookback (default 6) sets how many recent actions are scanned.

☁️ Passive Features
> Prompt Assembly and Insertion
- Toolbox collects story cards with the custom Prompt type, then assembles them into a "Story Bible" JSON object that is equivalent to the prompt entered by the user on scenario creation.
- The assembled prompt is injected a number of lines behind the last line of context determined by the Floating Prompt Distance setting in the Toolbox Configuration story card.

> Cleaning and Filtering
- Toolbox filters out lines that start with "//", "> Error", ">>>", "/AC", and various tool-specific words and phrases from context.
- The AI will not see these lines.
- Toolbox cleans outputs, trimming hanging sentence fragments and ensuring proper spacing between context and output.
- This allows the user to play normally and with minimal text loss while keeping Raw Outputs Enabled on (Gameplay -> Testing and Feedback)

🔧 Modifying Configuration Settings
> Toolbox can be reconfigured through the Toolbox Configuration story card.
> Settings include: Tool Output Length, CYOA Option Length, Floating Prompt Distance, Hidden Tool Outputs, and info about the current protagonist and the number of tokens added and removed by Toolbox.
> For more information, check the Notes section of the Toolbox Configuration story card.

# Toolbox Configuration Story Card Notes
Settings can be changed by adjusting numbers or changing "true" and "false". Do not change the card in any other way. Below are detailed explanations of each setting.

General Settings
> Pin Config Card
- (true or false)
- If true, the script will attempt to keep this card near the top of Story Cards.

> Tool Output Length
- (number, 10+)
- Changes the word count target the AI is given for generating tool output text.
- If this is too high, outputs may cut off without completing.
- Lower numbers typically result in quicker generation.

> Cyoa Option Length
- (number, 5+)
- Changes the word count target the AI is given for generating each CYOA option.
- As this is increased, options become more detailed (often detrimentally)
- If is set too high, the output may contain fewer than four options.

> Floating Prompt Distance
- (number, 0+)
- Changes how far back the floating prompt is inserted.
- The floating prompt is assembled from story cards with the Prompt type.
- It is then placed behind this many paragraphs of context.
- If there aren't this many paragraphs, the prompt is placed at the top.

Hide Outputs From AI
- (true or false)
- Each tool listed defaults to hiding its outputs from the AI.
- Hidden outputs are bracketed by symbols that mark them for filtering by the script.
- If set to false, that tool's outputs will be configured as AI-visible asides.
- This changes how outputs are produced going forward, and is NOT retroactive.

Info
- These fields are meant to be informative, and not used for chaning settings.

> Protagonist
- (name)
- Tracks the current protagonist of the story.
- This name is used as the default argument for many tools.
- It is also added at the end of the floating prompt.
- Changing this here will change the default argument and floating prompt.
- However, it will not necessarily change who the story focuses on.
- For that, enter the following command in Do or Say: /p New Protagonist Name

> Tokens Added to Context by Toolbox
- (number)
- Tracks how many tokens Toolbox added to context last turn.
- Typically includes Prompt story cards and tool-specific instructions.
- Note: This does not count tokens added by Inner Self or AI Dungeon.

> Tokens Removed from Context by Toolbox
- (number)
- Tracks how many tokens Toolbox removed from context last turn.
- Typically these are comments starting with "//", the input lines from tool activations, and certain toolbox outputs, such as CYOA options and hidden outputs (those bracketed by special symbols).

> Net Effect on Context Size
- (number)
- Tokens added minus tokens removed.
- When this number is added to the token count AI Dungeon gives you when you view context, it should be close to the actual number of tokens sent to the AI; the number that counts against your token limit.
- Note: this method does not account for Inner Self.

---

## Credits

- **Toolbox v2.0** — [FaraC / blanchelyan](https://github.com/blanchelyan/Toolbox) (MIT)
- **Inner Self v1.0.2** — LewdLeah (free and open-source)
- **KV cache-compatible Inner Self modification** — [Zoocata1](https://github.com/Zoocata1/KV-Inner-Self) (MIT)
- **Auto-Cards v1.1.3** — LewdLeah (open-source)
