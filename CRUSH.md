# CRUSH.md for WeatherFront

This document outlines key information for agents working on the WeatherFront codebase.

## Build/Run Commands

- **Run Application:** `./weatherfront [latitude] [longitude]`

There are no explicit build steps as this is a shell script.

## Lint/Test Commands

There are no dedicated linting or testing frameworks configured. For general quality, adhere to the following code style guidelines.

## Code Style Guidelines (Shell Scripting)

- **Shebang:** Ensure scripts start with `#!/bin/bash` or `#!/usr/bin/env bash`.
- **Naming Conventions:**
    - Variables: `UPPER_SNAKE_CASE` for environment variables and constants, `lower_snake_case` for local variables.
    - Functions: `snake_case`.
- **Error Handling:** Use `set -euo pipefail` at the beginning of scripts to ensure:
    - `e`: Exit immediately if a command exits with a non-zero status.
    - `u`: Treat unset variables as an error.
    - `o pipefail`: The return value of a pipeline is the status of the last command to exit with a non-zero status, or zero if all commands exit successfully.
- **Indentation:** Use 4 spaces for indentation.
- **Comments:** Use `#` for comments. Comment complex logic or non-obvious parts of the script.
- **Quoting:** Always quote variables and command substitutions (`"$var"`, `$(command)`) to prevent word splitting and globbing issues.
- **Readability:** Prioritize clear and straightforward logic. Break down complex tasks into functions.

## Cursor/Copilot Rules

No specific Cursor or Copilot rules found in the repository. Adhere to the general code style guidelines above.
