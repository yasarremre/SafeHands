# Deep Init - Hierarchical Project Context Generation

Generate comprehensive AGENTS.md files throughout your project structure, creating directory-specific context that agents automatically read during sessions.

## Usage

```
/project:deep-init
```

---

You are running **DEEP INIT** - a comprehensive project initialization that creates hierarchical context files.

## What Deep Init Does

1. **Analyzes Project Structure**: Maps all directories and their purposes
2. **Generates AGENTS.md Files**: Creates context files in key directories
3. **Documents Patterns**: Identifies and documents code patterns, conventions
4. **Creates Navigation**: Builds a map that helps agents understand the codebase

## Execution Plan

### Step 1: Root Analysis
Analyze the root directory:
- Identify project type (monorepo, single app, library)
- Detect frameworks and languages
- Find configuration files
- Understand the build system

### Step 2: Directory Mapping
For each significant directory, determine:
- Purpose and responsibility
- Key files and their roles
- Dependencies and relationships
- Conventions specific to that area

### Step 3: Generate AGENTS.md Files

Create `.claude/AGENTS.md` or `AGENTS.md` in key directories:

**Root AGENTS.md** should contain:
- Project overview and purpose
- Tech stack and architecture
- Getting started instructions
- Directory structure overview
- Key conventions

**Directory-specific AGENTS.md** should contain:
- Directory purpose
- File naming conventions
- Key patterns used here
- Important files to know about
- Relationships to other directories

### Step 4: Update Root CLAUDE.md
Enhance the main CLAUDE.md with:
- Links to directory-specific context
- Updated conventions
- New patterns discovered

## Directory Priority

Focus on these directories first:
1. `src/` or `app/` - Main source code
2. `lib/` or `packages/` - Shared libraries
3. `api/` or `server/` - Backend code
4. `components/` or `ui/` - UI components
5. `tests/` or `__tests__/` - Test files
6. `config/` - Configuration
7. `scripts/` - Build/utility scripts

## Output Format

For each AGENTS.md created, report:
```
Created: path/to/AGENTS.md
Purpose: [brief description]
Key info: [what agents will learn from this]
```

## Begin

Start analyzing the project structure and generating hierarchical context files.
