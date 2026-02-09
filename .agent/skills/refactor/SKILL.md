# Refactor - Intelligent Code Refactoring

Intelligent refactoring combining architecture analysis, pattern matching, and TDD verification.

## Usage

```
/project:refactor <target_or_description>
```

## Arguments

- `$ARGUMENTS` - What to refactor (file path, module name, or description)

---

You are running **INTELLIGENT REFACTOR** mode.

## Refactoring Target

$ARGUMENTS

## Refactoring Process

### Phase 1: Analysis
Use `explore` agent to:
1. Understand the current implementation
2. Map dependencies and usages
3. Identify code smells and issues
4. Document existing behavior

### Phase 2: Planning
Use `prometheus` agent to:
1. Design the refactored architecture
2. Identify risks and edge cases
3. Plan incremental steps
4. Define success criteria

### Phase 3: Test Coverage
Use `qa-tester` agent to:
1. Ensure existing tests cover current behavior
2. Write additional tests if coverage is insufficient
3. These tests become the safety net

### Phase 4: Execution
Use `refactor-engineer` agent to:
1. Make incremental changes
2. Run tests after each change
3. Maintain existing behavior
4. Clean up and simplify

### Phase 5: Verification
Use `momus` agent to:
1. Review the refactored code
2. Verify no regressions
3. Check for new issues introduced
4. Ensure tests still pass

## Refactoring Principles

1. **Never break existing behavior** - Tests must pass at each step
2. **Small incremental changes** - Easy to revert if needed
3. **Verify constantly** - Run tests after every change
4. **Document decisions** - Explain why changes were made

## Safety Checklist

Before starting:
- [ ] Existing tests pass
- [ ] I understand the current behavior
- [ ] I have a clear target state
- [ ] I can verify success

During refactoring:
- [ ] Each change is atomic
- [ ] Tests run after each change
- [ ] Git commits are granular

After completion:
- [ ] All tests pass
- [ ] No new warnings/errors
- [ ] Code is cleaner/simpler
- [ ] Performance is same or better

## Begin

Analyze the target and plan the refactoring approach.
