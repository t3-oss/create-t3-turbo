# Custom Commands

This directory contains shared command definitions that can be reused across multiple AI coding assistants (Claude Code, Cursor, etc.).

## Structure

Each command is defined as a standalone markdown file containing the full prompt/instructions for that command.

## Usage

### Claude Code

Reference the shared command in `.claude/commands/` using file inclusion:

```markdown
---
description: Command description
---

{{file:docs/custom-commands/command-name.md}}
```

### Cursor

Create a command in `.cursor/commands/` with the Cursor-specific structure and reference the shared command:

```markdown
# Command Title

## Overview
[Brief description]

## Shared Command Reference
@docs/custom-commands/command-name.md

## Checklist
- [ ] Step 1
- [ ] Step 2
```

## Available Commands

- **pr.md** - Generate PR descriptions and create/update pull requests based on branch diff
