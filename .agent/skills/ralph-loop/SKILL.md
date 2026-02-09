# Ralph Loop - Self-Referential Development Loop

Run Claude in a continuous loop with the same prompt until task completion. This implements the "Ralph Wiggum technique" - an autonomous agentic loop where Claude receives the same prompt repeatedly until it completes the task.

## Usage

```
/project:ralph-loop <task_description>
```

## Arguments

- `$ARGUMENTS` - The task description and completion criteria

## How It Works

1. You provide a task with clear completion criteria
2. Claude works on the task iteratively
3. After each iteration, Claude checks if the task is complete
4. If not complete, the same prompt is re-injected
5. Loop continues until completion promise is found or max iterations reached

## Prompt Template

When starting a Ralph loop, use this structure:

```
Task: [Your specific task]

Completion Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] All tests passing
- [ ] Documentation updated

When ALL criteria are met, output: <promise>COMPLETE</promise>

If blocked after multiple attempts:
- Document what's blocking progress
- List what was attempted
- Suggest alternative approaches
```

---

You are now entering a **Ralph Loop**. This is a self-referential development loop that continues until task completion.

## Your Task

$ARGUMENTS

## Instructions

1. **Analyze Current State**: Check git status, existing code, and any previous work
2. **Execute**: Make progress on the task
3. **Verify**: Run tests, linters, or other verification
4. **Report**: Document what you accomplished this iteration

## Completion Rules

- If the task is FULLY COMPLETE, output: `<promise>COMPLETE</promise>`
- If the task is NOT complete, end with: `<continue>NEXT_ITERATION</continue>`
- If you are BLOCKED and cannot proceed, output: `<blocked>REASON</blocked>`

## Important

- Each iteration builds on previous work visible in files and git history
- Don't repeat work that's already done
- Focus on what remains incomplete
- Be persistent but intelligent about retries

## Begin

Analyze the current state and make progress on the task. Remember to output the appropriate marker when done.
