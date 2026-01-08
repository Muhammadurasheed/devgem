# Devgem Engine Deep Dive

> [!NOTE]
> This document provides a surgical analysis of the core engine components: The Orchestrator Agent (The Brain) and the GCloud Service (The Hands).

## 1. The Orchestrator Agent (`backend/agents/orchestrator.py`)

The `OrchestratorAgent` is the autonomous decision-maker of Devgem. It operates on a conversational loop, translating user intent into infrastructure actions.

### 1.1 The "Socrates-Einstein" Logic Loop

1.  **Context Injection**: Every message is prefixed with the current project state (Repo URL, Analysis results, Env vars).
2.  **Intent Classification**:
    *   **Simple Command**: "Deploy", "Yes" -> Trigger `deploy_to_cloudrun` immediately (Token Optimized path).
    *   **Complex Query**: "Why did the build fail?" -> Full context analysis + RAG-like retrieval of logs.
3.  **Tool Selection**: The agent selects from `clone_and_analyze_repo`, `deploy_to_cloudrun`, `get_deployment_logs`.
4.  **Fallback Mechanism**:
    *   **Primary**: Vertex AI (Gemini 2.0 Flash Exp).
    *   **Fallback**: Gemini 1.5 Pro/Flash via API Key.
    *   *Self-Correction*: If Vertex AI hits quota, it seamlessly switches to the API key model mid-request.

### 1.2 The Progress Notification System
Crucial for the "Chat" experience, the Orchestrator doesn't just wait for completion. It streams updates.
- **Mechanism**: `ProgressNotifier` class linked to WebSocket session.
- **Flow**: `Tool Execution` -> `Progress Callback` -> `WebSocket Safe Send` -> `React UI`.
- **Optimization**: Uses `asyncio.sleep(0)` to force event loop flushes, ensuring real-time "typing" feel even during heavy blocking operations (like git clones).

## 2. The GCloud Infrastructure Service (`backend/services/gcloud_service.py`)

This is the "FAANG-Level" engineering component. It bypasses the `gcloud` CLI entirely, using Python client libraries for maximum performance and reliability.

### 2.1 The "No-CLI" Philosophy
- **Standard**: Most tools wrap `subprocess.run(['gcloud', ...])`. This is slow, error-prone, and hard to debug.
- **Devgem**: Uses `google.cloud.run_v2`, `google.cloud.devtools.cloudbuild_v1`.
- **Benefit**: Structured error handling, faster execution (gRPC), and typed responses.

### 2.2 The Deployment Pipeline
1.  **Source Tarball**:
    -   Recursively reads project dir.
    -   Filters using `.dockerignore` logic (in-memory).
    -   Creates a `tar.gz` stream in RAM.
2.  **Cloud Storage Upload**:
    -   Streams the tarball directly to `gs://{project_id}_cloudbuild/`.
3.  **Cloud Build Trigger**:
    -   Submits a build job referencing the GCS object.
    -   **Optimization**: Uses `kaniko` cache (implied by standard builds) or Cloud Build caching to speed up subsequent builds.
4.  **Cloud Run Deployment**:
    -   Creates `run_v2.Service` object.
    -   **Configuration**:
        -   CPU: 1, Memory: 512Mi (Cost optimized).
        -   Scaling: 0 to 10 instances (Serverless).
        -   Traffic: 100% to latest revision.

### 2.3 Resiliency Patterns
- **Retry Strategy**: Exponential backoff with jitter for all network calls.
- **Circuit Breaker**: Detects if GCP APIs are down and fails fast.
- **Correlation IDs**: Every request is tagged with a `correlation_id` for tracing requests across the stack.

## 3. Data Models & Persistence

- **Session Context**: Currently stored in `app.session_orchestrators`.
    -   *Risk*: Restarting the server wipes all active conversational contexts.
    -   *Risk*: Scaling to multiple backend replicas is impossible without sticky sessions.
- **User/Deployment Data**: Managed by `UserService` and `DeploymentService`, likely persisting to a local JSON or simple DB (implied by `utils` or `data` folder).

## 4. Key Algorithms

### 4.1 Usage Tracking
- Middleware intercepts every request.
- Tracks: API calls, Deployment counts, Build minutes.
- Enforces limits based on User Tier (Free, Pro, Enterprise).

### 4.2 Auto-Analysis
- `AnalysisService` uses AST parsing (Python) and regular expressions (Node/Go) to detect:
    -   Frameworks (Django, Flask, Next.js).
    -   Required Ports (8000, 3000, 5000).
    -   Environment Variables patterns (`os.getenv`, `process.env`).
