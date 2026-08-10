# AI Development Environment

> **Scope:** Antigravity IDE — Event Sourced Ledger Repository  
> **Audience:** AI agents operating within this repository  
> **Update Policy:** Update this document whenever the IDE configuration, installed skills, or MCP servers change.

---

## Purpose

This document is the **single source of truth** for every AI agent working on this repository. It describes the complete AI-assisted development environment: every installed skill, every available MCP server, every built-in capability, and the principles that govern when each tool should be used.

Its existence is motivated by a simple principle: **an AI agent that understands its own tooling makes better decisions**. Rather than defaulting to manual implementation when a specialized tool exists, or invoking heavyweight tools when a native capability suffices, agents can consult this document and select the most appropriate instrument for any given task.

This document does **not** describe the project itself. For project-level documentation, refer to the companion documents listed in the [Repository Integration](#repository-integration) section.

---

## Environment Overview

| Dimension | Detail |
|---|---|
| **Host IDE** | Antigravity IDE (Google DeepMind) |
| **Installed Skills** | 1 (`graphify`) |
| **MCP Servers** | 6 (`chrome-devtools-mcp`, `context7`, `filesystem`, `playwright`, `sequential-thinking`, `serena`) |
| **Installed Plugins** | 3 (`chrome-devtools-plugin`, `google-antigravity-sdk`, `modern-web-guidance-plugin`) |
| **Native Built-in Tools** | Code editing, file viewing, web search, web fetch, image generation, shell command execution, browser subagent, task scheduling, permission management |

> **Note:** Operating system and shell details are host-machine-specific and intentionally omitted. The `run_command` entry in the [Built-in Agent Capabilities](#built-in-agent-capabilities) table documents shell-specific behaviour where relevant.

The environment is oriented toward **full-stack development**, with strong coverage across code intelligence, browser automation, documentation lookup, structured reasoning, and codebase visualization.

---

## Installed Skills

Skills are pre-defined, curated instruction sets that extend the agent's capabilities for specialized tasks. They are discovered automatically from the global configuration root and activated when a task matches their description.

### Graphify

| Field | Detail |
|---|---|
| **Skill Name** | `graphify` |
| **Trigger Keyword** | `/graphify` or any natural-language question about codebase architecture, file relationships, or project structure when `graphify-out/` exists |

#### Purpose

Graphify transforms any folder of source files — code, documentation, papers, images, or video — into a persistent, queryable **knowledge graph**. It uses AST extraction for code and LLM-assisted semantic extraction for prose, producing three artifacts: an interactive HTML visualization, a GraphRAG-ready JSON export, and a plain-language `GRAPH_REPORT.md`.

#### Primary Responsibilities

- **Entity and relationship extraction** from source files using AST (for code) and semantic NLP (for docs/papers/images)
- **Community detection** — groups of related files and symbols that naturally cluster together
- **God node identification** — highly connected nodes that are architectural pivots
- **Surprising connection discovery** — cross-community links that reveal hidden dependencies
- **Graph querying** — BFS/DFS traversal to answer natural-language questions about the codebase
- **Shortest-path tracing** between any two concepts or modules
- **Plain-language explanation** of any single node in the graph

#### Supported Modes and Flags

| Mode / Flag | Purpose |
|---|---|
| `/graphify` (bare) | Full pipeline on the current directory |
| `/graphify <path>` | Full pipeline on a specific local path |
| `/graphify <github-url>` | Clone a GitHub repo and run the full pipeline |
| `--update` | Incremental re-extraction: only processes new or changed files |
| `--cluster-only` | Reruns community detection on an existing graph without re-extracting |
| `--mode deep` | Thorough extraction for richer inferred edges |
| `--directed` | Builds a directed graph preserving edge direction |
| `--no-viz` | Skips HTML visualization; produces report and JSON only |
| `--svg`, `--graphml` | Additional export formats (SVG, GraphML for Gephi/yEd) |
| `--neo4j`, `--falkordb` | Database export targets |
| `--wiki` | Generates an agent-crawlable wiki (index + one article per community) |
| `--obsidian` | Exports an Obsidian vault |
| `--mcp` | Starts an MCP stdio server for agent access to the graph |
| `--watch` | Auto-rebuilds the graph on file changes |
| `/graphify query "<question>"` | BFS traversal to answer a question from an existing graph |
| `/graphify path "A" "B"` | Shortest path between two concepts |
| `/graphify explain "<node>"` | Plain-language explanation of a specific node |
| `/graphify add <url>` | Fetch a URL, add it to the corpus, and update the graph |

#### Fast Path (Existing Graph)

When `graphify-out/graph.json` already exists in the project root and the request is a natural-language question about the codebase (e.g., "How does X work?", "What calls Y?", "Trace the data flow through Z"), graphify **skips all extraction steps** and runs `graphify query "<question>"` directly. This is the expected mode during active development.

#### When to Use Graphify

- **Before making large structural or architectural changes** — understand the full impact surface by querying the graph for what depends on the module being changed.
- **When onboarding to an unfamiliar part of the codebase** — run a query to get oriented without reading every file.
- **When investigating cross-cutting concerns** — e.g., which files handle serialization, which modules touch the event store.
- **When answering questions about codebase architecture** — prefer querying the graph over ad-hoc file reading.
- **After significant refactoring** — run `--update` to refresh the graph with changed files only.
- **When generating architecture diagrams or reports** — the HTML output and `GRAPH_REPORT.md` are publication-ready.

#### When NOT to Use Graphify

- **Trivial, targeted file lookups** — if you already know the exact file and symbol, use `view_file` or Serena's `find_symbol` instead.
- **Real-time compilation or lint errors** — use Serena's `get_diagnostics_for_file` for IDE-level diagnostics.
- **Documentation lookups for external libraries** — use Context7 for that purpose.
- **Pure text search across files** — use `grep_search` or Serena's `replace_in_files` for pattern matching.
- **When no files have been extracted yet and the corpus is very small** — the overhead of a full graph build outweighs the benefit for a 5-file project.

#### Example Development Scenarios

```
Scenario: "How does the event replay mechanism work?"
Action:   /graphify query "event replay mechanism"
Why:      The graph traversal returns the exact nodes, edges, and source locations
          describing the replay path — far faster than manually tracing file by file.

Scenario: "We're about to refactor CommandHandler. What will break?"
Action:   /graphify query "CommandHandler dependencies"
         then: /graphify path "CommandHandler" "EventStore"
Why:      Reveals all dependents before any code is touched.

Scenario: "Generate an architecture overview for the team."
Action:   /graphify . --directed
Why:      Produces graph.html (interactive) and GRAPH_REPORT.md with god nodes,
          community clusters, and surprising connections.

Scenario: "New files were added to the projections layer."
Action:   /graphify --update
Why:      Incremental re-extraction updates only changed files; the existing graph
          is preserved and extended rather than rebuilt from scratch.
```

---

## MCP Servers

Model Context Protocol (MCP) servers provide structured tool interfaces that the agent can call during task execution. All six servers below are installed and available.

---

### 1. `context7`

#### Purpose
Fetches **current, version-accurate documentation** for libraries, frameworks, SDKs, APIs, and CLI tools directly from authoritative sources. This is the primary mechanism for avoiding stale training data when working with external dependencies.

#### Supported Capabilities

| Tool | Description |
|---|---|
| `resolve-library-id` | Resolves a library name to a Context7-compatible ID (must be called before `query-docs`) |
| `query-docs` | Retrieves documentation snippets, API references, code examples, and migration guides for the resolved library |

#### How to Use

1. Call `resolve-library-id` with the library name (use proper casing: `Next.js`, not `nextjs`).
2. Use the returned library ID to call `query-docs` with a specific question.
3. Do not call `resolve-library-id` more than 3 times per question.

#### Best Use Cases

- Looking up API syntax for a library before implementing an integration
- Checking version migration requirements (e.g., upgrading from one major version to another)
- Verifying configuration schemas for build tools, ORMs, or message brokers
- Confirming CLI flags for tools like `dotnet`, `ef` (Entity Framework), or `docker`
- Resolving ambiguity when training data may not reflect recent releases

#### Limitations

- **Do not use** for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts
- Requires a live network connection
- Documentation quality depends on source reputation (prefer `High` or `Medium` reputation results)

#### Example Operations

```
"What is the correct signature for IEventHandler<T> in MassTransit 8?"
→ resolve-library-id("MassTransit", "IEventHandler interface signature")
→ query-docs(libraryId, "IEventHandler generic interface")

"How do I configure Npgsql connection pooling?"
→ resolve-library-id("Npgsql", "connection pooling configuration")
→ query-docs(libraryId, "connection pool settings MaxPoolSize")
```

---

### 2. `filesystem`

#### Purpose
Provides direct, structured access to the repository's file system beyond what native tools offer. Useful for batch operations, directory tree inspection, and cross-platform path resolution.

#### Supported Capabilities

| Tool | Description |
|---|---|
| `read_file` | Read a single file's content |
| `read_text_file` | Read a text file with encoding options |
| `read_media_file` | Read a binary media file |
| `read_multiple_files` | Read several files in one call (batch) |
| `write_file` | Write content to a file |
| `edit_file` | Apply targeted edits to an existing file |
| `create_directory` | Create a directory and its parents |
| `list_directory` | List directory contents |
| `list_directory_with_sizes` | List directory contents with file sizes |
| `directory_tree` | Recursive directory tree |
| `move_file` | Move or rename a file |
| `search_files` | Pattern-based file search |
| `get_file_info` | Retrieve file metadata (size, dates, permissions) |
| `list_allowed_directories` | List directories the agent is permitted to access |

#### Best Use Cases

- Batch reading multiple files in a single call to reduce round-trips
- Generating a full directory tree for architectural review
- Moving or renaming files as part of a refactoring
- Checking file metadata before processing

#### Limitations

- Operates within the permitted directory boundaries established by the IDE's permission system
- For complex, symbol-aware code edits, prefer Serena over this server

---

### 3. `serena`

#### Purpose
Provides **Language Server Protocol (LSP)-backed code intelligence** for the repository. Serena understands the code's semantic structure — classes, methods, interfaces, inheritance hierarchies — and can perform refactoring operations that are symbol-aware rather than text-aware.

> **Critical:** Before starting any coding task, call `serena/initial_instructions` to load the Serena Instructions Manual.

#### Supported Capabilities

| Tool | Description |
|---|---|
| `activate_project` | Activate the Serena project context for the current repository |
| `get_symbols_overview` | High-level symbol map of a file (classes, methods, properties) |
| `find_symbol` | Locate a symbol by name path pattern across the codebase |
| `find_referencing_symbols` | Find all symbols that reference a given symbol (call graph) |
| `find_implementations` | Find all concrete implementations of an interface or abstract class |
| `find_declaration` | Navigate to the declaration of a symbol |
| `get_diagnostics_for_file` | Retrieve compiler/LSP diagnostics (errors, warnings) for a file |
| `rename_symbol` | Rename a symbol and update all references automatically |
| `safe_delete_symbol` | Delete a symbol only if it is not referenced elsewhere |
| `replace_symbol_body` | Replace the entire body of a method or class |
| `insert_after_symbol` | Insert code immediately after a named symbol |
| `insert_before_symbol` | Insert code immediately before a named symbol |
| `replace_content` | Replace specific content within a file |
| `replace_in_files` | Bulk search-and-replace across multiple files (literal or regex) |
| `write_memory` | Persist a note to Serena's memory store |
| `read_memory` | Retrieve a previously stored note |
| `list_memories` | List all stored memory entries |
| `delete_memory` | Remove a memory entry |
| `rename_memory` | Rename a memory entry |
| `edit_memory` | Edit the content of a memory entry |
| `onboarding` | Get onboarding guidance for the current project |
| `get_current_config` | Inspect the current Serena configuration |
| `initial_instructions` | Load the full Serena Instructions Manual |

#### Best Use Cases

- Renaming a domain concept across many files (e.g., renaming an interface or class project-wide)
- Finding all implementations of an interface before changing its signature
- Getting a high-level symbol map of a Java class or package before editing it
- Safe deletion of a method after confirming no callers remain
- Inserting interface implementations or boilerplate at named insertion points
- Retrieving LSP diagnostics to detect compiler errors without running a full build
- Performing bulk annotation, import, or import-path changes across a module with `replace_in_files`

#### Limitations

- Effectiveness depends on the LSP server being properly initialized for the repository's language
- Symbol-based operations work best when the project compiles cleanly; diagnostics may reduce accuracy in broken builds
- `replace_in_files` with regex requires careful validation — always prefer `dry_run=true` first for non-trivial patterns

#### Example Operations

```
"Find all classes that implement EventHandler"
→ serena/find_implementations("EventHandler")

"Rename the LedgerEntry class everywhere"
→ serena/rename_symbol("LedgerEntry", "JournalEntry")

"What methods are defined in EventStore.java?"
→ serena/get_symbols_overview("src/main/java/.../EventStore.java")

"Replace all references to 'InMemoryEventRepository' with 'JpaEventRepository'"
→ serena/replace_in_files(needle="InMemoryEventRepository", repl="JpaEventRepository", mode="literal", dry_run=true)
  then: serena/replace_in_files(..., dry_run=false, occurrence_ids=[...selected ids])
```

---

### 4. `playwright`

#### Purpose
Provides **programmatic browser automation** using Playwright. Use for UI interaction testing, end-to-end scenario verification, and browser-based data extraction.

#### Supported Capabilities

| Tool | Description |
|---|---|
| `browser_navigate` | Navigate to a URL |
| `browser_navigate_back` | Go back in browser history |
| `browser_click` | Click an element by selector |
| `browser_type` | Type text into a focused element |
| `browser_fill_form` | Fill multiple form fields in one call |
| `browser_press_key` | Simulate a keyboard key press |
| `browser_hover` | Hover over an element |
| `browser_drag` | Drag an element to a target |
| `browser_drop` | Drop a dragged element |
| `browser_select_option` | Select an option from a dropdown |
| `browser_find` | Find an element using a selector query |
| `browser_snapshot` | Capture the accessibility tree of the current page |
| `browser_take_screenshot` | Capture a screenshot of the current page |
| `browser_evaluate` | Execute JavaScript in the browser context |
| `browser_run_code_unsafe` | Execute arbitrary JavaScript (use with caution) |
| `browser_console_messages` | Retrieve console log messages |
| `browser_network_requests` | List all network requests |
| `browser_network_request` | Inspect a specific network request |
| `browser_handle_dialog` | Accept or dismiss browser dialogs |
| `browser_file_upload` | Upload a file via a file input element |
| `browser_wait_for` | Wait for a selector or condition to be satisfied |
| `browser_tabs` | List open browser tabs |
| `browser_resize` | Resize the browser viewport |
| `browser_close` | Close the current page |

#### Best Use Cases

- Verifying that a UI renders correctly after code changes
- Running end-to-end tests for API interactions visible through the browser
- Extracting data from rendered pages that require JavaScript execution
- Simulating user workflows to catch regressions

#### Limitations

- Requires a Playwright-compatible browser to be installed and accessible
- Not appropriate for static content fetching — use `read_url_content` for that
- Slower than direct API calls; prefer API-level testing over browser simulation where possible

---

### 5. `chrome-devtools-mcp`

#### Purpose
Provides deep **Chrome DevTools integration** for debugging, performance analysis, accessibility auditing, and Lighthouse scoring. This server exposes capabilities that go beyond standard browser automation — including heap snapshots, performance traces, and multi-page inspection.

#### Supported Capabilities

| Tool | Description |
|---|---|
| `navigate_page` | Navigate the active Chrome tab to a URL |
| `new_page` | Open a new Chrome tab |
| `close_page` | Close a Chrome tab |
| `select_page` | Switch to a specific Chrome tab |
| `list_pages` | List all open Chrome tabs |
| `take_screenshot` | Capture a screenshot |
| `take_snapshot` | Capture the DOM snapshot (accessibility tree) |
| `click` | Click an element |
| `fill` | Fill a text input |
| `fill_form` | Fill multiple form fields |
| `hover` | Hover over an element |
| `drag` | Drag an element |
| `press_key` | Simulate a key press |
| `type_text` | Type text into the active element |
| `upload_file` | Upload a file |
| `handle_dialog` | Accept or dismiss dialogs |
| `wait_for` | Wait for a condition |
| `resize_page` | Resize the browser viewport |
| `emulate` | Emulate a specific device or network condition |
| `evaluate_script` | Execute JavaScript in the page context |
| `get_console_message` | Retrieve a specific console message |
| `list_console_messages` | List all console messages |
| `get_network_request` | Inspect a specific network request |
| `list_network_requests` | List all captured network requests |
| `lighthouse_audit` | Run a Lighthouse audit (accessibility, SEO, best practices) |
| `performance_start_trace` | Start a Chrome performance trace |
| `performance_stop_trace` | Stop a trace and retrieve results |
| `performance_analyze_insight` | Drill into a specific performance insight from a trace |
| `take_heapsnapshot` | Capture a JavaScript heap snapshot |

#### Best Use Cases

- Running Lighthouse accessibility and SEO audits on the application's UI
- Profiling runtime performance and identifying bottlenecks with trace analysis
- Investigating memory leaks via heap snapshots
- Debugging JavaScript errors in a live browser session
- Emulating specific devices or network conditions (e.g., simulating a 3G mobile user)

#### Differences from Playwright

Both Playwright and Chrome DevTools MCP automate a browser, but they serve different purposes:

| Aspect | Playwright MCP | Chrome DevTools MCP |
|---|---|---|
| Primary Use | Behavioral UI testing | Deep debugging and performance analysis |
| Performance Tracing | Not available | Full Chrome trace + insight analysis |
| Lighthouse | Not available | Full audit (accessibility, SEO, best practices) |
| Heap Snapshots | Not available | Supported |
| Device Emulation | Viewport only | Full DevTools device/network emulation |
| Interaction Automation | Primary strength | Supported but secondary |

#### Limitations

- Some tools (e.g., `evaluate_script`) may require explicit user permission approval before use. Check `list_permissions` to verify current grants.
- Requires Chrome (or Chromium) to be running and accessible via the DevTools protocol.

---

### 6. `sequential-thinking`

#### Purpose
Provides a **structured, reflective problem-solving framework** that decomposes complex or ambiguous tasks into a sequence of explicit thought steps. Each thought can build on, revise, question, or branch from prior steps. Produces a verified solution hypothesis at the end.

#### Supported Capabilities

| Tool | Description |
|---|---|
| `sequentialthinking` | Submit a single thought step in an ongoing reasoning chain |

#### Key Features

- Dynamic adjustment of the total thought count as the problem unfolds
- Explicit revision of earlier conclusions (`isRevision`, `revisesThought`)
- Branching for exploring alternative approaches (`branchFromThought`, `branchId`)
- Expression of uncertainty without aborting the chain
- Hypothesis generation and verification cycles
- Filtering of irrelevant information at each step

#### Best Use Cases

- Planning a multi-file refactoring before any code is touched
- Analyzing an ambiguous bug where the root cause is not immediately obvious
- Designing a new feature that has multiple valid implementation paths
- Reviewing a proposed architectural change for hidden consequences
- Tasks where the full scope is not clear from the outset

#### Limitations

- Not appropriate for simple, well-defined tasks that can be answered in one step
- Does not produce code directly — it produces a reasoning chain that informs subsequent tool calls
- Each call is a single thought; the reasoning session must be managed across multiple calls

#### Example Scenario

```
Task: "Decide whether to use optimistic locking or pessimistic locking for the event store."
→ Call sequentialthinking with an initial thought outlining the trade-offs.
→ Continue through thoughts covering: concurrency profile, existing infrastructure,
  failure modes, recovery cost, and team familiarity.
→ Final thought produces a recommended approach with rationale.
→ Use the conclusion to inform implementation decisions.
```

---

## Installed Plugins

Plugins bundle capabilities for specific domains. Three plugins are installed. They do not expose additional tools directly beyond the MCP servers and skills described above, but they configure the agent's behavior for particular workflows.

| Plugin | Purpose |
|---|---|
| `chrome-devtools-plugin` | Configures the Chrome DevTools MCP server for reliable automation, in-depth debugging, and performance analysis via the Chrome DevTools Protocol. Maintained by the Chrome DevTools Team. |
| `google-antigravity-sdk` | Provides guidance for using the Google Antigravity Python SDK to build AI agents with Gemini integration. Maintained by Google. |
| `modern-web-guidance-plugin` | Curated collection of agent skills and guidelines for modern web development. Maintained by Google. |

> **Note:** Plugin version numbers are intentionally omitted. Versions change on upgrade and a stale version number is misleading. Run `list_dir` on the plugin configuration directory to inspect current versions if needed.

---

## Built-in Agent Capabilities

In addition to skills and MCP servers, the Antigravity IDE provides the following native capabilities that are always available without additional configuration:

| Capability | Description |
|---|---|
| **`view_file`** | Read the contents of any permitted file, with line-range selection |
| **`write_to_file`** | Create a new file (fails if the file already exists unless `Overwrite=true`) |
| **`replace_file_content`** | Make a single contiguous replacement within an existing file |
| **`multi_replace_file_content`** | Make multiple non-contiguous replacements within an existing file in one call |
| **`list_dir`** | List the contents of a directory |
| **`grep_search`** | Ripgrep-powered pattern search across files, with regex and glob filter support |
| **`run_command`** | Execute a PowerShell command (requires user approval) |
| **`search_web`** | Perform a web search and retrieve a summarized result with citations |
| **`read_url_content`** | Fetch and convert a public URL's HTML content to Markdown (no JavaScript) |
| **`generate_image`** | Generate or edit images from a text prompt |
| **`browser_subagent`** | Spawn a dedicated browser subagent for complex, multi-step web interactions |
| **`ask_question`** | Present a multiple-choice question to the user for clarification |
| **`ask_permission`** | Request elevated file or command permissions from the user |
| **`schedule`** | Set a one-shot timer or recurring cron job |
| **`manage_task`** | List, monitor, or terminate background tasks |
| **`list_permissions`** | Inspect the current permission grants |

---

## Tool Selection Matrix

Use this matrix to select the most appropriate tool for common development tasks.

| Development Task | Preferred Tool | Reason |
|---|---|---|
| **Codebase architecture question** | `graphify` (query) | Graph traversal returns context-rich answers in seconds; faster than manual file tracing |
| **Exploring an unfamiliar module** | `serena/get_symbols_overview` → `serena/find_symbol` | LSP-aware symbol map provides structure before reading code |
| **Large-scale refactoring (rename)** | `serena/rename_symbol` | Updates all references atomically; avoids missed usages |
| **Bulk search-and-replace** | `serena/replace_in_files` | Supports literal and regex; dry-run mode prevents mistakes |
| **Targeted single-file edit** | `replace_file_content` or `multi_replace_file_content` | Native, fast, and sufficient for isolated changes |
| **External library documentation** | `context7` | Always current; preferred over relying on training data |
| **Architecture visualization** | `graphify` (full pipeline + HTML) | Produces an interactive graph with community detection |
| **UI behavior verification** | `playwright` or `chrome-devtools-mcp` | Playwright for interaction testing; Chrome DevTools for debugging |
| **Accessibility / SEO audit** | `chrome-devtools-mcp/lighthouse_audit` | Lighthouse provides scored, categorized results |
| **Performance profiling** | `chrome-devtools-mcp` (trace + analyze) | Full Chrome trace with per-insight drill-down |
| **Memory leak investigation** | `chrome-devtools-mcp/take_heapsnapshot` | JS heap snapshots expose retained object graphs |
| **File pattern search** | `grep_search` | Ripgrep is fast, supports regex, and handles large trees |
| **Reading multiple files at once** | `filesystem/read_multiple_files` | Reduces round-trips vs. sequential `view_file` calls |
| **Directory tree inspection** | `filesystem/directory_tree` | Recursive view; better than repeated `list_dir` calls |
| **Complex problem decomposition** | `sequential-thinking` | Structured thought chain surfaces assumptions and alternatives |
| **Compiler / lint diagnostics** | `serena/get_diagnostics_for_file` | IDE-level diagnostics without running a build |
| **Finding all implementations** | `serena/find_implementations` | LSP-backed; exhaustive across the entire solution |
| **Fetching static web content** | `read_url_content` | Faster than a browser subagent for pages without JavaScript |
| **Running shell commands** | `run_command` | Direct PowerShell execution (requires user approval) |
| **Generating test data or diagrams** | `generate_image` | On-demand image generation for visual assets |
| **Persisting agent notes** | `serena/write_memory` | Survives session boundaries; searchable in future sessions |
| **Impact analysis before changes** | `graphify` (query + path) | Reveals dependency surface before any code is modified |

---

## Recommended AI Workflow

The following workflow is mandatory for all non-trivial tasks. **Do not skip directly to implementation.** Each phase has a defined gate that must be satisfied before proceeding.

```
1. READ DOCUMENTATION
   ├── Read this document to confirm available tooling
   ├── Read ARCHITECTURE.md to understand structural constraints
   ├── Read PRD.md for requirements and TRD.md for technical constraints
   ├── Read the relevant feature-specific docs (DATABASE_DESIGN.md, API_GUIDELINES.md, etc.)
   └── Check Knowledge Items (KI) for prior agent context
          ↓
2. UNDERSTAND EXISTING CODE
   ├── If graphify-out/graph.json exists → run /graphify query to orient within the codebase
   ├── If no graph exists → use serena/get_symbols_overview + grep_search to map the module
   └── Use context7 for any external library API questions before writing a single line of code
          ↓
3. ANALYZE
   ├── Use sequential-thinking to reason through the approach for complex or ambiguous tasks
   ├── Identify all files, interfaces, and layers that will be affected
   └── Confirm that the intended approach does not violate ARCHITECTURE.md dependency rules
          ↓
4. PRODUCE IMPLEMENTATION PLAN
   ├── Write implementation_plan.md covering: what changes, in which files, in what order
   ├── List any open questions or design decisions that require user input
   └── Identify which project documentation files will need updating after implementation
          ↓
── GATE: WAIT FOR USER APPROVAL ──────────────────────────────────────────────
   Do not proceed past this point until the user explicitly approves the plan.
   If the plan involves multiple independent phases, implement only the approved phase.
──────────────────────────────────────────────────────────────────────────────
          ↓
5. IMPLEMENT (APPROVED PHASE ONLY)
   ├── Use serena for symbol-aware, LSP-backed edits (rename, find references, insert at symbol)
   ├── Use replace_file_content / multi_replace_file_content for targeted file edits
   ├── Prefer serena/replace_in_files with dry_run=true for bulk changes before applying
   └── Use run_command only when the shell is required (builds, test runs, migrations)
          ↓
6. VERIFY
   ├── Run serena/get_diagnostics_for_file to confirm no compiler errors introduced
   ├── Run automated tests via run_command (mvn test or equivalent)
   └── Use playwright or chrome-devtools-mcp for UI layer verification only where applicable
          ↓
7. UPDATE DOCUMENTATION
   ├── Update all affected project documents (ARCHITECTURE.md, API_GUIDELINES.md, etc.)
   ├── If the graphify graph is stale, run /graphify --update to refresh it
   └── Do not consider implementation complete until documentation reflects the change
          ↓
8. SUGGEST COMMIT MESSAGE
   └── Propose a conventional commit message following the format in CODING_STANDARDS.md
       (e.g., feat:, fix:, refactor:, docs:) with a concise, accurate description
          ↓
9. UPDATE PROJECT_LOG.md
   └── Append a dated entry summarising: what was changed, why, and which files were affected
```

---

## Autonomous Tool Selection Guidelines

The following rules govern how AI agents in this repository should select tools without requiring explicit user instruction.

### General Principles

1. **Prefer specialized tools over native capability when the task matches the tool's domain.** If graphify can answer an architecture question faster than reading files, use graphify.
2. **Never rely on training data for external library APIs.** Always use `context7` before implementing integrations with libraries, frameworks, or cloud services. Training data is a snapshot; documentation is live.
3. **Consult the knowledge graph before exploring files manually.** If `graphify-out/graph.json` exists, a query will return contextualized, graph-traversed answers faster than file-by-file inspection.
4. **Use `sequential-thinking` before implementing solutions to ambiguous problems.** A structured reasoning chain surfaces hidden assumptions and prevents premature implementation.
5. **Prefer `serena` for any code edit that involves symbols.** Renaming, finding references, and inserting at named locations are all safer and more reliable through LSP than through text replacement.
6. **Use `filesystem/read_multiple_files` for batch reads.** Do not issue sequential `view_file` calls when a batch call is available.
7. **Use `replace_in_files` with `dry_run=true` first.** For any non-trivial bulk replacement, inspect the prospective changes before applying them.
8. **Use browser tools only for UI-layer concerns.** Do not use Playwright or Chrome DevTools MCP to test business logic that can be tested at the API or unit level.
9. **Use `run_command` sparingly.** Native file-reading tools are preferred for discovery. Reserve `run_command` for operations that require the shell: building, testing, migrations, and package management.
10. **Do not use multiple overlapping tools for the same task.** If `serena/find_symbol` answers the question, do not also run `grep_search` for the same information.

### Tool Escalation Order

When a task can be satisfied at multiple levels of tool sophistication, prefer the simpler level first:

```
1. Native built-in capability (view_file, grep_search, list_dir)
       ↓ only if insufficient
2. MCP server tool (serena, filesystem, context7, sequential-thinking)
       ↓ only if insufficient
3. Specialized skill (graphify — for architecture-scale questions or full corpus traversal)
       ↓ only if insufficient
4. Browser automation (playwright, chrome-devtools-mcp — UI and performance concerns only)
       ↓ only if insufficient
5. Shell command execution (run_command — requires user approval; reserve for builds, tests, migrations)
```

> **Rationale:** Browser automation and shell execution carry higher risk and latency than MCP tools. Graphify sits between MCP and browser automation because it has a one-time build cost but is far more powerful than individual file reads for architectural questions.

### Permission Awareness

- The agent operates within the permission boundaries established by the IDE. Check `list_permissions` when uncertain whether a path or command is permitted.
- Request permission with `ask_permission` when a needed operation falls outside current grants.
- Never access `.env`, credential files, or secrets files unless explicitly required by the task and permitted by the user.

### Decision Escalation Rules

Some decisions must not be made autonomously. Escalate to the user before proceeding when:

- A change would affect the public API surface (additions, modifications, or removals)
- A change would alter database schema or event structure
- A new external dependency (library, service) would be introduced
- The intended approach contradicts or extends a documented architectural decision in `DECISIONS.md`
- The impact of a change cannot be fully assessed from the available codebase context
- The approved implementation plan does not clearly cover the situation encountered during implementation

When in doubt, stop and ask. An unnecessary question costs seconds. An autonomous wrong decision may cost hours.

---

## Development Principles

AI agents working on this repository must adhere to the following principles regardless of the task.

### Architecture First

Before introducing new patterns, modules, or abstractions, verify that the existing architecture (documented in `ARCHITECTURE.md` and `TRD.md`) does not already provide a canonical approach. This project follows a strict event-sourced, layered architecture with defined dependency rules. Deviations require documented justification in `DECISIONS.md`.

Specifically:

- Do not allow business logic to leak into controllers, repositories, or DTOs
- Do not allow the domain layer to depend on infrastructure or framework concerns
- Corrections to financial history must always be represented as new events, never as mutations

### Documentation First

Before implementing any feature, read the relevant documentation. This is not optional:

| Task involves... | Read first... |
|---|---|
| Any feature | `PRD.md`, `TRD.md` |
| Persistence or schema | `DATABASE_DESIGN.md` |
| API surface changes | `API_GUIDELINES.md` |
| Architectural changes | `ARCHITECTURE.md`, `DECISIONS.md` |
| Code style or patterns | `CODING_STANDARDS.md` |

Implementation that contradicts documented requirements must be flagged before proceeding.

### Follow Established Coding Standards

All generated code must conform to the standards in `CODING_STANDARDS.md`. This project targets **Java 21**. Standards include naming conventions, constructor injection over field injection, custom domain exceptions, structured logging, and single-responsibility class design. Do not introduce alternative patterns without explicit approval.

### Avoid Unnecessary Dependencies

Do not add a new Java library, Maven dependency, or external service unless no existing capability in the codebase, the installed MCP servers, or the built-in tools can satisfy the need. Any new dependency must be justified by a `DECISIONS.md` entry.

### Keep Documentation Synchronized

Every implementation change that affects system behaviour, structure, or interfaces must be accompanied by documentation updates. At minimum, add an entry to `PROJECT_LOG.md`. For architectural changes, update `ARCHITECTURE.md`. For API changes, update `API_GUIDELINES.md`.

### Quality Gates Before Code Generation

Do not generate code until all of the following are true:

- The relevant project documentation has been read
- The affected area of the codebase has been understood via graphify or serena
- An implementation plan has been written and approved by the user
- No open design questions remain unresolved

### Use the Most Appropriate Tool

The existence of specialized tooling is the result of deliberate configuration. Using the wrong tool for a task produces slower, less accurate, and less maintainable results. Always select the tool that is best suited to the task, as described in the [Tool Selection Matrix](#tool-selection-matrix).

### Preserve Existing Comments and Docstrings

When editing existing code, preserve all comments and docstrings that are unrelated to the change being made. These represent intentional documentation decisions that must not be erased as a side effect of implementation work.

---

## Repository Integration

This document describes the **AI development environment**. It is complementary to, but distinct from, the project's substantive documentation. The following table clarifies the relationship:

| Document | Describes | Relationship to This Document |
|---|---|---|
| `docs/PRD.md` | Product requirements, user stories, and acceptance criteria | Defines *what* to build; agents should read this before implementing features |
| `docs/TRD.md` | Technical requirements, constraints, and non-functional requirements | Defines *how* the system must behave; governs technical decisions |
| `docs/ARCHITECTURE.md` | System structure, component relationships, and design patterns | Defines the architectural context that graphify and serena help agents navigate |
| `docs/DATABASE_DESIGN.md` | Schema design, event store structure, and data access patterns | Must be read before any persistence-layer change; context7 supplements with ORM/driver docs |
| `docs/API_GUIDELINES.md` | API design standards, versioning, and contract rules | Governs any API surface change; context7 assists with framework-specific implementation |
| `docs/CODING_STANDARDS.md` | Naming, style, testing, and code organization rules | All generated code must conform; serena and native edit tools enforce these mechanically |
| `docs/PROJECT_ROADMAP.md` | Planned features, milestones, and delivery timeline | Provides priority context; graphify can help assess impact of roadmap items on the codebase |
| `docs/DECISIONS.md` | Architectural Decision Records (ADRs) | Explains *why* the system is the way it is; agents must consult this before proposing changes |
| `docs/PROJECT_LOG.md` | Chronological record of changes and decisions | Agents must append a log entry after every significant change |

**The critical distinction:** the documents above describe the *project*. This document describes the *environment in which AI agents work on the project*. Both are necessary for effective AI-assisted development, and neither is a substitute for the other.

---

## Guiding Philosophy

The tooling described in this document exists to **augment engineering judgment, not replace it**.

Every tool — whether a knowledge graph, a language server, a documentation fetcher, or a browser automation framework — is an instrument that improves the precision, speed, and correctness of work that ultimately serves the human engineers responsible for this system. The goal is not automation for its own sake; it is the elimination of avoidable errors, the reduction of time spent on mechanical tasks, and the amplification of the capacity for deliberate, thoughtful design.

An AI agent that uses the right tool at the right time, understands the architecture it is modifying, respects the decisions that came before it, and leaves accurate documentation behind is a genuine engineering collaborator. One that makes uninformed changes, ignores established patterns, or relies on stale knowledge when live documentation is available is a liability.

**Intelligence in tool selection is itself a form of engineering quality.** Use this document accordingly.

---

*This document is maintained in `docs/ai/AI_DEVELOPMENT_ENVIRONMENT.md`. Update it whenever the IDE configuration, installed skills, MCP servers, or project workflow changes. Do not let this document drift from the live environment.*
