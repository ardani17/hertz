# Implementation Plan: Simple DM Backend

## Overview

Implement DM backend in dependency order: schema, types, repositories, service rules, API routes, tests, and docs. Mark each task `[x]` immediately after it is completed and verified.

## Tasks

- [ ] 1. Database migration and shared contracts
  - [ ] 1.1 Create `db/migrations/009_create_simple_dm.sql`
    - Add `dm_conversations`
    - Add `dm_participants`
    - Add `dm_messages`
    - Add `dm_blocks`
    - Add `dm_message_reports`
    - Add `context_post_id` as optional future-friendly post context
    - Add checks that phase one conversation type is direct
    - Add indexes for inbox, participants, messages, blocks, and reports
    - Keep migration additive and idempotent where practical
    - _Requirements: 2.1-2.9, 4.6-4.8, 5.10-5.12, 6.1-6.5, 8.1-8.6, 9.1-9.6, 10.6_

  - [ ] 1.2 Add shared DM types
    - Create `shared/types/directMessage.ts`
    - Export the types from `shared/types/index.ts`
    - Define conversation, peer, message, search, and report DTOs
    - _Requirements: 2.2, 3.5, 5.1-5.10, 9.1-9.4_

- [ ] 2. Repositories
  - [ ] 2.1 Create conversation repository
    - Implement find by direct key
    - Implement create conversation with participants
    - Implement list inbox with unread count
    - Implement conversation detail for thread header
    - Implement inbox filters for all, unread, and archived
    - Implement participant guard helpers
    - Implement archive for current participant
    - _Requirements: 2.1-2.9, 4.1-4.8, 6.4-6.5, 7.5-7.7_

  - [ ] 2.2 Create message repository
    - Implement paginated message list
    - Implement insert message
    - Implement update conversation last message
    - Implement read state update
    - Implement soft delete own message
    - Validate optional media reference
    - _Requirements: 5.1-5.12, 6.1-6.5, 7.1-7.7_

  - [ ] 2.3 Create block and report repositories
    - Implement block lookup in both directions
    - Implement block and unblock
    - Implement message report create
    - _Requirements: 8.1-8.6, 9.1-9.6_

  - [ ] 2.4 Create user search repository method
    - Search verified members by username, display name, and Telegram names
    - Return suggested verified members when query is blank
    - Exclude current user and banned users
    - Limit result size
    - _Requirements: 3.1-3.8_

- [ ] 3. Service layer
  - [ ] 3.1 Implement `directMessageService.ts`
    - Enforce member-only access
    - Validate direct conversation creation
    - Reuse existing direct conversation when possible
    - Normalize message input
    - Validate optional media
    - Enforce participant checks
    - Enforce block checks
    - _Requirements: 1.1-1.7, 4.1-4.8, 5.1-5.12, 8.1-8.6_

  - [ ] 3.2 Add audit logging and rate-limit touchpoints
    - Log conversation creation
    - Log message send without message body
    - Log block and report actions
    - Prepare service errors for API mapping
    - _Requirements: 10.1-10.5_

- [ ] 4. API routes
  - [ ] 4.1 Add conversation routes
    - `GET /api/dm/conversations`
    - `POST /api/dm/conversations/direct`
    - `GET /api/dm/conversations/[conversationId]`
    - `POST /api/dm/conversations/[conversationId]/read`
    - `POST /api/dm/conversations/[conversationId]/archive`
    - _Requirements: 2.1-2.9, 4.1-4.8, 6.1-6.5, 7.5-7.7_

  - [ ] 4.2 Add message routes
    - `GET /api/dm/conversations/[conversationId]/messages`
    - `POST /api/dm/conversations/[conversationId]/messages`
    - `DELETE /api/dm/messages/[messageId]`
    - `POST /api/dm/messages/[messageId]/report`
    - _Requirements: 5.1-5.10, 7.1-7.4, 9.1-9.6_

  - [ ] 4.3 Add user search and block routes
    - `GET /api/dm/users/search?q=`
    - `POST /api/dm/users/[userId]/block`
    - `DELETE /api/dm/users/[userId]/block`
    - _Requirements: 3.1-3.7, 8.1-8.6_

- [ ] 5. Verification
  - [ ] 5.1 Add backend tests
    - Guest endpoints return 401
    - Search returns verified members only
    - Direct conversation is idempotent
    - Conversation detail returns peer header data
    - Send message updates inbox preview
    - Read endpoint clears unread count
    - Block prevents sending and creation
    - Soft delete hides message body
    - Inbox filters return all, unread, and archived lists correctly
    - _Requirements: 1.1-1.7, 2.1-2.9, 3.1-3.8, 4.1-4.8, 5.1-5.12, 6.1-6.5, 7.1-7.7, 8.1-8.6_

  - [ ] 5.2 Run regression checks
    - Run the relevant test command for shared/API code
    - Run TypeScript checks or build if required by changed files
    - Confirm no Signal Ledger route behavior is changed by DM work
    - _Requirements: 10.6_
