# Start Work - Execute Tasks from Plans

Systematically execute tasks from a Prometheus-generated plan or TODO list.

## Usage

```
/project:start-work [plan_file_or_task]
```

## Arguments

- `$ARGUMENTS` - Optional: path to plan file or specific task to start

---

You are running **START WORK** - systematic task execution mode.

## How It Works

1. **Find the Plan**: Look for existing plans in:
   - `PLAN.md` in root
   - `.claude/PLAN.md`
   - `TODO.md`
   - Or use the provided plan file

2. **Parse Tasks**: Extract actionable tasks from the plan

3. **Execute Systematically**: Work through tasks in order, respecting dependencies

4. **Track Progress**: Update task status as you complete them

## Task Input

$ARGUMENTS

## Execution Strategy

### If a plan file exists:
1. Read and parse the plan
2. Identify the next uncompleted task
3. Check for dependencies
4. Execute the task
5. Mark as complete
6. Move to next task

### If no plan exists:
1. Use `prometheus` to create an implementation plan
2. Save the plan to `.claude/PLAN.md`
3. Begin execution

## Task Execution Rules

For each task:
1. **Understand**: What exactly needs to be done?
2. **Prepare**: What files/context do I need?
3. **Execute**: Do the work (delegate to appropriate agent)
4. **Verify**: Run tests, check the work
5. **Document**: Update the plan with completion status

## Delegation Guide

Delegate based on task type:
- Architecture tasks → `prometheus`
- Backend implementation → `backend-engineer`
- Frontend implementation → `frontend-ui-ux-engineer`
- General coding → `atlas`
- Refactoring → `refactor-engineer`
- Testing → `qa-tester`
- Documentation → `document-writer`
- Complex debugging → `oracle`

## Progress Tracking

Update tasks with status:
- `[ ]` - Not started
- `[~]` - In progress
- `[x]` - Completed
- `[!]` - Blocked

## Begin

Find the plan and start executing tasks systematically.
