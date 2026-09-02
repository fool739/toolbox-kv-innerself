// @cache-compatible
handleToolboxContext()

// The modifier receives `text` (AID's global context variable).
// If AID uses `var`, text === globalThis.text. If AID uses `let`, they are separate.
// To cover both, insertContractPrompt both returns AND writes to globalThis.text.
const modifier = (text) => {
  text = insertContractPrompt(text)
  return { text, stop }
}

modifier(text)
