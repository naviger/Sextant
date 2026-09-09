# Debug Mode

Goal:
Identify the immediate root cause of the current failure.

Rules:

1. Focus on a single failure at a time.
2. Use logs, configuration, and source code first.
3. MemoryGraph should only be queried if architectural context is required.
4. Do not perform broad MemoryGraph searches.
5. Ignore optimization, refactoring, and future improvements until the failure is resolved.
6. Minimize token usage by requesting only the next piece of evidence needed.

Response format:

Observation
Most Likely Cause
Evidence
Verification Step
Recommended Fix
