# Gate-trigger challenge set — development only

The initial 144 claims are balanced by truth class, **not** by citation/schema failure mode. Nothing in them guarantees that removing either component will flip an output. Current v2 has a runtime schema gate and a second-pass same-model citation gate for Gemini audit strengths; these fixtures are development probes, not held-out ablation results.

`challenge-cases.jsonl` is a separate *development-only contract fixture* with deliberately malformed candidate outputs. It does not change the 24-resume corpus, 75/25 split, test IDs, or sealed-test SHA-256. These probes are for implementation and branch coverage before the final evaluation; they are **not** outcome data and do not justify any efficacy claim.

| Probe | Citation gate should catch | Schema gate should catch |
| --- | --- | --- |
| Missing citation, otherwise valid | Yes | No |
| Unknown citation ID, otherwise valid | Yes | No |
| Cited passage does not entail claimed metric | Yes, if semantic support validation is implemented | No |
| Missing required verdict, valid citation | No | Yes |
| Invalid verdict enum, valid citation | No | Yes |
| Missing citation and verdict | Yes | Yes |

The “semantic support” probe distinguishes mere citation presence from actual evidence verification. If the future citation component checks only ID existence, that probe should remain a known failure; do not silently redefine success.

Before any ablation, add executable tests showing that each arm actually toggles the named gate and leaves the other gate unchanged. The current production endpoint exposes no bypass, and these fixture fields are not identical to its API shape. Only then evaluate held-out accuracy. A branch being triggered does not guarantee a model decision flip; report observed deltas rather than assuming them.
