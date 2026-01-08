# Devgem System Architecture

> [!IMPORTANT]
> This document details the architectural blueprint of Devgem (ServerGem v6), a "Action Era" deployment orchestration platform for Google Cloud Run.

## High-Level Overiew

Devgem acts as an intelligent, conversational interface between developers and Google Cloud Platform. Unlike traditional CI/CD pipelines which require static configuration (YAML), Devgem uses an active **Orchestrator Agent** (Gemini-powered) to understand intent, analyze code, and interactively drive the deployment process.

### System Context Diagram

```mermaid
graph TD
    User([Developer])
    Frontend[Devgem Frontend\n(React/Vite)]
    Backend[Devgem Backend\n(FastAPI)]
    
    subgraph "The Devgem Brain"
        Orchestrator[Orchestrator Agent\n(Gemini 1.5/2.0)]
        Context[Session Context\n(In-Memory)]
    end
    
    subgraph "Infrastructure Layer"
        GCloud[GCloud Service]
        GitHub[GitHub Service]
        Docker[Docker Service]
    end
    
    subgraph "Google Cloud Platform"
        CloudBuild[Cloud Build]
        CloudRun[Cloud Run]
        ArtifactRegistry[Artifact Registry]
        Storage[Cloud Storage]
        SecretManager[Secret Manager]
    end

    User <-->|WebSockets| Frontend
    Frontend <-->|WebSockets/HTTP| Backend
    Backend <--> Orchestrator
    Orchestrator <--> Context
    Orchestrator -->|Calls Tools| GCloud
    Orchestrator -->|Calls Tools| GitHub
    
    GCloud -->|Triggers| CloudBuild
    GCloud -->|Deploys to| CloudRun
    CloudBuild -->|Pushes Image| ArtifactRegistry
    CloudBuild -->|Reads Source| Storage
```

## Core Components

### 1. The Frontend (React/Vite)
- **Role**: Intelligent Command Center.
- **Key Features**:
    - **WebSocket Real-time UI**: Displays deployment progress, logs, and chat in real-time.
    - **State Management**: Uses `WebSocketContext` to maintain connection persistence.
    - **Visual Feedback**: Renders markdown and specialized UI components (like deployment trackers) based on AI responses.

### 2. The Backend (FastAPI)
- **Role**: The Central Nervous System.
- **Key Files**:
    - `app.py`: Entry point, handles WebSocket lifecycle and HTTP routes.
    - `agents/orchestrator.py`: The "Brain". Manages conversation history, context, and tool execution.
    - **Session Management**: Currently uses in-memory `session_orchestrators` dict to map `session_id` to `OrchestratorAgent`.

### 3. The Infrastructure Layer
- **Role**: The "Hands" of the system.
- **Key Service**: `GCloudService` (`services/gcloud_service.py`).
- **Philosophy**: "No CLI Required". Uses Google Cloud Python SDKs (`google-cloud-run`, `google-cloud-build`) for direct API manipulation.
- **Mechanism**:
    1.  **Source Handling**: Clones repo locally -> Tars it -> Uploads to GCS bucket.
    2.  **Build**: Triggers Cloud Build on the GCS tarball -> Pushes to Artifact Registry.
    3.  **Deploy**: Creates/Updates Cloud Run service using the new image.

## Data Flow: The "Chat-to-Deploy" Pipeline

1.  **Intent Recognition**: User says "Deploy my repo".
2.  **Context Loading**: `OrchestratorAgent` loads project context (repo URL, env vars).
3.  **Analysis**: `AnalysisService` scans the code (locally) to detect framework, language, and required ports.
4.  **Configuration**: Agent generates optimized `Dockerfile` and `dockerignore` dynamically.
5.  **Execution**: Agent calls `deploy_to_cloudrun` tool.
6.  **Real-time Feedback**: `ProgressNotifier` streams updates (build logs, health checks) via WebSocket to the User.

## Security Architecture

- **Authentication**: Usage of `google-cloud-iam` for service account management.
- **Isolation**: Each user deployment gets a unique service name (prefixed with `user_id`).
- **Secrets**: Environment variables marked as "Secret" are stored in Google Secret Manager (planned).
- **Quota Management**: `UsageTrackingMiddleware` ensures users don't abuse free tier limits.

## Technology Stack

- **AI Model**: Gemini 1.5 Flash / Gemini 2.0 Flash Exp (Vertex AI).
- **Backend Language**: Python 3.11+.
- **API Framework**: FastAPI + Uvicorn.
- **Cloud Provider**: Google Cloud Platform (fully serverless usage).
- **Communication**: WebSockets (Action Cable style interactions).
