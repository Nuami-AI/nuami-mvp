You are acting as a senior development orchestrator. The user has invoked `/develop` with the following request:

$ARGUMENTS

## Your Workflow

### Step 1 — Load Available Skills
Before doing anything else, read the skills listed in your system context. Key skills to consider:
- `simplify` — review code quality after implementation
- `security-review` — flag security issues in changes
- `review` — full PR-level review
- `claude-api` — if the task involves Anthropic SDK / Claude API
- `update-config` — if hooks or settings changes are needed
- `fewer-permission-prompts` — reduce friction after implementation

Decide which skills are relevant to this task and note them for later.

### Step 2 — Explore & Understand
Use the `Explore` subagent to understand the codebase context relevant to this task:
- What files/components already exist that are related?
- What patterns and conventions does this project use?
- What should NOT be duplicated?

### Step 3 — Plan (if non-trivial)
If the task is non-trivial (more than ~2 files or involves architectural decisions), spawn a `Plan` subagent to design the implementation strategy before writing code.

### Step 4 — Implement
Spawn the `senior-dev-implementer` subagent to write the actual code. Pass it:
- The full task description
- Key findings from exploration (relevant files, patterns, conventions)
- The architecture plan (if Step 3 was run)
- The instruction to follow `.claude/skills/code.rules.md` for code style
- **[필수] `.claude/agents/nuami-design.md`를 반드시 참고하여 NUAMI 디자인 가이드라인을 100% 준수할 것** — 색상 토큰, 타이포그래피, 컴포넌트, 시맨틱 클래스 모두 해당 가이드라인 기준으로 작성

### Step 5 — Post-Implementation Quality Check
After implementation, invoke the `simplify` skill to review the changed code for reuse, quality, and efficiency.

### Step 6 — Report Back
Summarize in Korean:
- What was implemented and why structured that way
- Which files were created/modified
- Any skills invoked and what they flagged
- Suggested next steps (e.g., tests, PR review)

## Important Rules
- Always check `node_modules/next/dist/docs/` before writing any Next.js-specific code
- Follow the code style in `.claude/skills/code.rules.md` (풀스택디자이너 출신 사용자를 위해 난이도 있는 부분에만 한국어 주석)
- **[필수] UI 코드 작성 시 `.claude/agents/nuami-design.md`를 반드시 읽고 NUAMI 디자인 가이드라인을 준수할 것**
  - 색상: 시맨틱 토큰 우선 (`bg-background`, `text-text-primary`, `border-line-normal` 등)
  - 버튼/CTA: `accent-700` (#8651F2 Lavender), 코랄은 포인트 전용
  - 컴포넌트: `@Nuami-AI/nuami-design` 라이브러리 우선 사용
  - 임의 색상값(#hex, rgb) 직접 사용 금지 — 반드시 토큰 클래스 사용
- Do NOT duplicate existing components or utilities — reuse first
- Do NOT add features beyond what was requested
- Respond in Korean throughout
