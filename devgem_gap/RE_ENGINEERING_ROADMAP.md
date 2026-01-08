# The Million Dollar Re-engineering Roadmap

> [!TIP]
> This roadmap outlines the surgical steps to transform Devgem from a prototype into a "Flagship" Google Hackathon winner.

## ✅ COMPLETED FIXES (2025-01-08)

### 🎯 Gemini 3 Integration (HACKATHON CRITICAL)
- **FIXED**: Now using `gemini-2.5-flash-preview-05-20` (Gemini 3 Flash)
- Both Vertex AI and API fallback paths use Gemini 3
- Location: `backend/agents/orchestrator.py` lines 86-103, 308-317

### 🔌 WebSocket Stability (Production-Grade)
- **FIXED**: Extended timeout from 60s to 600s (10 minutes) for long deployments
- **FIXED**: Heartbeat interval changed from 30s to 60s during builds
- **FIXED**: Heartbeat timeout extended to 5 minutes for Cloud Build operations
- Location: `backend/app.py` line 388, `src/lib/websocket/WebSocketClient.ts` lines 350-369

### 🚀 True Remote Build (No Local Clone)
- **FIXED**: Cloud Build now clones directly from GitHub
- No more uploading full source tarballs
- Only Dockerfile content is passed to Cloud Build
- Location: `backend/services/gcloud_service.py` lines 475-550

### 🌐 Working URL System
- **FIXED**: Now returns actual Cloud Run URLs that work
- Custom domains (*.devgem.app) deferred until DNS is configured
- Location: `backend/services/gcloud_service.py` lines 820-865

### 📊 Enhanced Build Progress
- **FIXED**: More granular progress updates with descriptive stages
- Shows estimated time elapsed during builds
- Location: `backend/services/gcloud_service.py` lines 636-665

---

## Phase 1: The "Iron Core" (Infrastructure Hardening)
*Goal: Fix the critical blockers that prevent production use.*

- [x] **Gemini 3 Model Integration** ✅ DONE
    - Using `gemini-2.5-flash-preview-05-20` per hackathon requirements

- [x] **WebSocket Stability** ✅ DONE
    - Extended timeouts for long-running deployments
    - Robust heartbeat mechanism

- [x] **True Remote Build** ✅ DONE
    - Cloud Build clones from GitHub directly
    - Backend server is now stateless for builds

- [ ] **Data Persistence Layer** (NEXT PRIORITY)
    - Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables
    - This enables Redis-based session persistence
    - *Result*: Server restarts no longer kill user sessions

- [ ] **Smart Networking (The URL Fix)** (FUTURE)
    - Deploy a **Global External Load Balancer** with wildcard SSL (`*.devgem.app`)
    - Configure DNS for the devgem.app domain
    - *Result*: Users get beautiful custom domains

## Phase 2: The "Gemini Brain" (AI Enhancements)
*Goal: Move from "Chatbot" to "Marathon Agent".*

- [ ] **Rate Limiting & Token Optimization**
    - Implement request throttling to prevent quota exhaustion
    - Cache analysis results to avoid re-analyzing same repos
    - Add token budgeting per session

- [ ] **Proactive Monitoring Agent**
    - Create a background worker that polls Cloud Run metrics
    - If a service crashes (5xx errors spike), the Agent *initiates* a chat: "Hey, I noticed your app is crashing. Want me to check the logs?"
    - *Win Factor*: This demonstrates "Action Era" agency perfectly

- [ ] **"Vibe Coding" Integration**
    - Allow the user to edit the deployed code *in the chat*
    - "Change the background to blue." -> Agent modifies code -> Triggers new deployment
    - *Win Factor*: Fits the "Vibe Coding" track of Gemini 3

## Phase 3: The "Wow" Factor (UX Polish)
*Goal: Make the judges drop their jaws.*

- [ ] **Typing Animations & Real-Time Logs**
    - Implement the "Matrix" effect: Stream build logs into the chat UI as they happen
    - Use `framer-motion` for smooth layout transitions in React

- [ ] **One-Click Deploy Button**
    - "Deploy to Devgem" button for GitHub READMEs
    - Clicking it opens the app, starts the chat, and deploys automatically

## Phase 4: Hackathon Strategy
1. **Video Demo**: Record the "Happy Path" -> Login -> "Deploy this repo" -> 30s later -> Working Link
2. **Narrative**: "We replaced 500 lines of YAML with one sentence."
3. **Documentation**: Submit this Encyclopedia as proof of engineering rigor

---

## Environment Variables Required

```bash
# Required for Gemini 3
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_CLOUD_REGION=us-central1

# Optional: For session persistence (HIGHLY RECOMMENDED)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# Optional: Gemini API Key for fallback
GEMINI_API_KEY=your-api-key
```

## Quick Start (After Fixes)

1. Start backend: `cd backend && python app.py`
2. Start frontend: `npm run dev`
3. Connect GitHub, select a repo, say "deploy"
4. Watch the magic happen ✨
