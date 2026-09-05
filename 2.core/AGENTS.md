# Core AI agent entry point

Read and follow [CONTRACT.md](CONTRACT.md). Use its task-context table to load the required policies and records for the current operation. This entry point contains no second copy of the rules.

For every attempted repository write, completion includes reporting the persistence result. Before giving the final response, follow the [Save confirmation format](system/operating-rules.md#save-confirmation-format). Do not substitute a conversational confirmation, tool result or provider-specific message for the required save receipt.
