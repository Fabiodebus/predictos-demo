# Letta Email Campaign Implementation Plan

## Overview
This document outlines the step-by-step implementation plan to fix the Letta client issues and implement a complete email campaign generation workflow using Exa research and Letta agents.

## Current State
- ✅ Exa research service is working and returns company research data
- ✅ Letta client streaming and content parsing issues have been resolved
- ✅ Agent discovery, memory management, and streaming are implemented
- ✅ Email display parsing and rendering issues have been fixed

## Implementation Steps

### Phase 1: Fix Letta Client Issues
**Status: ✅ COMPLETED**

#### Step 1.1: Fix Client Initialization ✅
- [x] Keep `project` parameter in LettaClient constructor (works correctly)
- [x] Use both `token` and `project` parameters as per SDK
- [x] Test client initialization with environment variables
- [x] Add proper error handling for missing API key

#### Step 1.2: Fix Message Response Handling ✅
- [x] Create `toLettaMessageType` utility function for message normalization
- [x] Handle snake_case vs camelCase field mapping with textify helper
- [x] Add defensive field handling for missing properties
- [x] Test with both streaming and non-streaming responses

#### Step 1.3: Fix Streaming Implementation ✅
- [x] Update `createStream` call with proper parameters:
  - `enableThinking: "true"` (string, not boolean)
  - `streamTokens: true` (for typewriter effect)
  - `includePings: true` (for long tool runs)
- [x] Fix chunk parsing to handle snake_case fields with extractReasoning/extractAssistantDelta
- [x] Test streaming with proper event handling
- [x] Added robust JSON parsing with extractCampaignJson

#### Step 1.4: Fix Content Display Issues ✅
- [x] Handle `[object Object]` display with textify function
- [x] Fix double accumulation in streaming route
- [x] Parse JSON only after stream completion
- [x] Map campaign JSON to structured emails

### Phase 2: Agent Discovery & Management
**Status: ✅ COMPLETED**

#### Step 2.1: List Agents by Project ✅
- [x] Implement `client.agents.list()` to get all agents
- [x] Filter by project ID from environment variables
- [x] Add error handling for API failures
- [x] Test agent listing functionality

#### Step 2.2: Find Copywriting Agent ✅
- [x] Use correct agent ID from environment variables
- [x] Handle cases where agent doesn't exist
- [x] Add retry logic (2 attempts) for agent discovery
- [x] Test agent discovery with valid and invalid IDs

### Phase 3: Memory Block Management
**Status: ✅ COMPLETED**

#### Step 3.1: List Memory Blocks ✅
- [x] Use `client.agents.blocks.list(agentId)` to get all blocks
- [x] Parse block list and find `lead-company-research` block
- [x] Add error handling for block listing
- [x] Test block listing functionality

#### Step 3.2: Create Memory Block (if needed) ✅
- [x] Check if `lead-company-research` block exists
- [x] Create block using `client.agents.blocks.create()` if missing
- [x] Set proper label and description
- [x] Test block creation

#### Step 3.3: Update Memory Block ✅
- [x] Format Exa research results as markdown
- [x] Use `client.agents.blocks.update()` to modify block value
- [x] Add retry logic (2 attempts) for memory operations
- [x] Test memory block updates

### Phase 4: Agent State Management
**Status: ✅ COMPLETED**

#### Step 4.1: Reset Agent Messages ✅
- [x] Use message reset before each campaign
- [x] Verify reset completion
- [x] Add retry logic (2 attempts) for reset operations
- [x] Test message reset functionality

### Phase 5: Enhanced Streaming Implementation
**Status: ✅ COMPLETED**

#### Step 5.1: Implement Proper Streaming ✅
- [x] Use `client.agents.messages.createStream()` with correct parameters
- [x] Handle all message types: `reasoning_message`, `assistant_message`, `usage_statistics`
- [x] Implement proper event parsing with snake_case handling
- [x] Test streaming with reasoning and final responses
- [x] Added robust content extraction with textify helpers
- [x] Fixed double accumulation issues

#### Step 5.2: Add Caching Layer ✅
- [x] Implement deterministic cache with company/query-based keys
- [x] Cache structure: `research:${companyDomain}:${searchQuery}`
- [x] Add 30-minute TTL for research results
- [x] Test caching functionality

### Phase 6: API Orchestration
**Status: ✅ COMPLETED**

#### Step 6.1: Create Main Workflow Endpoint ✅
- [x] Create API route that orchestrates entire workflow
- [x] Implement step-by-step execution with error handling
- [x] Add progress tracking for frontend feedback
- [x] Test complete workflow
- [x] Added streaming workflow endpoint

#### Step 6.2: Add Error Handling & Retries ✅
- [x] Implement retry logic for all API operations (2 attempts)
- [x] Add proper error messages and status codes
- [x] Handle partial failures gracefully
- [x] Test error scenarios
- [x] Increased timeout from 5 to 10 minutes

### Phase 7: Frontend Integration
**Status: ✅ COMPLETED**

#### Step 7.1: Update Frontend Components ✅
- [x] Add "Generate Email Campaign" button to research display
- [x] Implement timeline view for agent reasoning
- [x] Display streaming responses from API
- [x] Add loading states and error handling
- [x] Fixed email display parsing with proper JSON extraction

#### Step 7.2: Email Display Enhancement ✅
- [x] Parse campaign JSON structure correctly
- [x] Display all 3 emails with subjects and bodies
- [x] Handle different email formats robustly
- [x] Show expandable email cards

## Testing Strategy

### Unit Tests
- Test each individual function with mock data
- Verify error handling and retry logic
- Test message normalization and field mapping

### Integration Tests
- Test complete workflow from research to email generation
- Verify agent discovery and memory management
- Test streaming and caching functionality

### End-to-End Tests
- Test full user journey from frontend to backend
- Verify error scenarios and recovery
- Test performance with large research results

## Success Criteria

### Phase 1 Success
- [ ] Letta client initializes without errors
- [ ] Streaming responses work correctly
- [ ] Message normalization handles all field types
- [ ] No more 400s/500s errors

### Phase 2-4 Success
- [ ] Agent discovery works reliably
- [ ] Memory blocks are created/updated correctly
- [ ] Agent state is reset before each campaign
- [ ] All operations have proper retry logic

### Phase 5-7 Success
- [ ] Streaming provides real-time reasoning and responses
- [ ] Caching works correctly with session management
- [ ] Frontend displays timeline view properly
- [ ] Complete workflow functions end-to-end

## Dependencies

### Environment Variables Required
```
LETTA_API_KEY=your_api_key_here
LETTA_AGENT_ID=agent-xxxxxxxxx
LETTA_PROJECT_ID=project-xxxxxxxxx
EXA_API_KEY=your_exa_api_key_here
```

### External Dependencies
- Letta SDK: `@letta-ai/letta-client`
- Exa API for research
- Next.js API routes
- In-memory caching (Map/object)

## Notes

### Important Considerations
- All API calls should have retry logic (2 attempts)
- Use snake_case field mapping for Letta API responses
- Cache should persist until new session starts
- Agent should be reset before each new campaign
- Memory blocks should be updated with markdown-formatted research

### Breaking Changes
- Letta SDK uses `blocks` instead of `core_memory` (recent change)
- Streaming events use snake_case fields
- Project parameter is valid in SDK initialization

## Progress Tracking

Each step will be marked as completed with:
- ✅ Completed
- ❌ Not Started
- 🔄 In Progress
- ⚠️ Issues Found

Updates will be made to this document after each step is completed and tested.
