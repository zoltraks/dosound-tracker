# Session Findings - 1.4.7 Window Run

## erasableSyntaxOnly Rejects Parameter Properties

The app's `erasableSyntaxOnly` tsconfig flag rejects TypeScript constructor
parameter properties - `private readonly` modifiers on constructor
parameters fail typecheck outright. Declare the field and assign it in the
body. Routed to `WORKFLOW.md` Tooling Notes.

## Live View for Shared Decoders

Extracting the register mirror into `RegisterFile` showed the state decoder
`deriveYmState` needs the live array, not a snapshot - `toArray` would
allocate on every flush on the audio path. A deliberate `raw()` accessor
keeps the hot path allocation-free; it is documented as read-only.
