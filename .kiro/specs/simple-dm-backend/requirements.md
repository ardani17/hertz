# Requirements Document

## Introduction

Simple DM Backend adds X-style one-on-one chat to Horizon. The first phase is backend-only: conversation list, conversation detail for the thread header, user search, direct thread creation, message sending, read state, soft delete, archive, block, and report. It uses existing member authentication from Signal Ledger and does not add message requests, group chat, calls, video, or heavy realtime infrastructure.

DM is private member communication. Only verified Horizon Telegram members and admins can use it. Guests can never read or mutate DM data.

## Glossary

- **DM**: Direct message between Horizon users.
- **Conversation**: A one-on-one chat thread.
- **Participant**: A user inside a conversation.
- **Message**: Text or optional media record sent inside a conversation.
- **Direct_Key**: Deterministic key made from two sorted user IDs, used to prevent duplicate one-on-one conversations.
- **Unread_Count**: Count of messages created after the viewer's last read state.
- **Blocked_User**: A user who cannot send DM to the blocker.

## Requirements

### Requirement 1: Member-only access

**User Story:** As a platform owner, I want DM access limited to verified members, so private chat is not exposed to guests or unverified users.

#### Acceptance Criteria

1. THE DM API SHALL require an active member session for every endpoint.
2. WHEN a guest calls a DM endpoint, THE API SHALL return `401 AUTH_REQUIRED`.
3. WHEN the current user is banned, THE API SHALL reject DM access.
4. THE system SHALL reuse `getCurrentMember()` and `member_sessions`.
5. THE system SHALL NOT expose DM data through public feed APIs.
6. THE system SHALL treat admins as allowed DM users only when they have a valid member session or equivalent admin-to-member bridge explicitly added by implementation.
7. THE system SHALL require the current user to be an admin or have `verifiedMemberAt`.

### Requirement 2: Conversation inbox

**User Story:** As a member, I want to see my chat list like X, so I can quickly reopen recent conversations.

#### Acceptance Criteria

1. THE system SHALL provide `GET /api/dm/conversations`.
2. THE response SHALL include conversation id, peer profile, last message preview, unread count, and last message time.
3. THE list SHALL include only conversations where the current user is a participant.
4. THE list SHALL sort by `last_message_at DESC`.
5. THE endpoint SHALL support cursor pagination.
6. THE list SHALL exclude archived conversations for the viewer unless requested by query.
7. THE endpoint SHALL support X-style filters through `filter=all`, `filter=unread`, and `filter=archived`.
8. THE system SHALL provide `GET /api/dm/conversations/[conversationId]`.
9. THE conversation detail response SHALL include peer profile, participant state, block state, last read state, and optional context post summary.

### Requirement 3: User search for new message

**User Story:** As a member, I want to search members by name or username, so I can start a new DM from the New Message modal.

#### Acceptance Criteria

1. THE system SHALL provide `GET /api/dm/users/search?q=`.
2. THE endpoint SHALL search `users.username`, `users.display_name`, and Telegram name fields.
3. THE result SHALL exclude the current user.
4. THE result SHALL exclude banned users.
5. THE result SHALL return id, display name, username, avatar, and badge.
6. THE result SHALL be limited to verified members and admins.
7. WHEN query is blank, THE endpoint MAY return suggested verified members for the New Message modal.
8. THE endpoint SHALL support a small limit suitable for modal search.

### Requirement 4: Direct conversation creation

**User Story:** As a member, I want selecting a user to open a direct thread, so I can start chatting immediately.

#### Acceptance Criteria

1. THE system SHALL provide `POST /api/dm/conversations/direct`.
2. THE request SHALL accept `recipientUserId`.
3. THE API SHALL reject self-DM.
4. THE API SHALL reject banned or non-member recipients.
5. THE API SHALL reject creation when either user blocks the other.
6. THE API SHALL create one direct conversation per user pair.
7. WHEN the conversation already exists, THE API SHALL return the existing conversation.
8. THE system SHALL create two participant rows for a new conversation.

### Requirement 5: Message list and send

**User Story:** As a member, I want to read and send messages in a thread, so the chat behaves like a simple X DM.

#### Acceptance Criteria

1. THE system SHALL provide `GET /api/dm/conversations/[conversationId]/messages`.
2. THE message list SHALL require the current user to be a participant.
3. THE message list SHALL support cursor pagination.
4. THE system SHALL provide `POST /api/dm/conversations/[conversationId]/messages`.
5. THE send endpoint SHALL accept text body and optional media reference.
6. THE text body SHALL be trimmed.
7. THE text body SHALL be limited to 4000 characters.
8. THE API SHALL reject empty messages without media.
9. THE API SHALL reject sending when either participant has blocked the other.
10. WHEN a message is sent, THE system SHALL update `last_message_id` and `last_message_at`.
11. WHEN media is provided, THE system SHALL validate the media reference before storing it.
12. THE message list SHALL return newest pagination cursors while rendering messages in chronological order for a thread.

### Requirement 6: Read state and unread count

**User Story:** As a member, I want opened threads to become read, so the inbox unread state stays accurate.

#### Acceptance Criteria

1. THE system SHALL provide `POST /api/dm/conversations/[conversationId]/read`.
2. THE read endpoint SHALL update the current participant's `last_read_at`.
3. THE read endpoint MAY accept `lastReadMessageId`.
4. THE conversation list SHALL calculate unread count from messages after `last_read_at`.
5. THE sender's own messages SHALL NOT count as unread for the sender.

### Requirement 7: Soft delete and archive

**User Story:** As a member, I want basic cleanup controls, so I can manage my chat surface without destroying shared history.

#### Acceptance Criteria

1. THE system SHALL provide `DELETE /api/dm/messages/[messageId]`.
2. THE delete message endpoint SHALL only allow the sender to delete their own message.
3. THE system SHALL soft delete messages with `deleted_at`.
4. THE message list SHALL show deleted sender messages as deleted placeholders or omit body content.
5. THE system SHALL provide `POST /api/dm/conversations/[conversationId]/archive`.
6. THE archive endpoint SHALL archive only for the current participant.
7. WHEN the last message is deleted by its sender, THE inbox preview SHALL avoid exposing deleted body content.

### Requirement 8: Blocking

**User Story:** As a member, I want to block another user, so unwanted DM cannot continue.

#### Acceptance Criteria

1. THE system SHALL provide `POST /api/dm/users/[userId]/block`.
2. THE system SHALL provide `DELETE /api/dm/users/[userId]/block`.
3. THE block endpoint SHALL reject self-block.
4. WHEN user A blocks user B, user B SHALL NOT be able to send DM to user A.
5. WHEN a block exists in either direction, new direct conversation creation SHALL be rejected.
6. THE block state SHALL be unique per blocker and blocked user pair.

### Requirement 9: Moderation report

**User Story:** As a member, I want to report abusive DM, so admins can investigate without reading all private chats.

#### Acceptance Criteria

1. THE system SHALL provide `POST /api/dm/messages/[messageId]/report`.
2. THE report endpoint SHALL require the reporter to be a participant.
3. THE report endpoint SHALL accept reason and optional details.
4. THE system SHALL store report status as `open`, `reviewing`, `resolved`, or `rejected`.
5. THE system SHALL NOT add a general admin inbox for all DM content in phase one.
6. THE system MAY expose reported message context to admin moderation in a later task.

### Requirement 10: Audit and safety

**User Story:** As a maintainer, I want DM actions logged and rate limited, so the feature is safe to run in production.

#### Acceptance Criteria

1. THE system SHALL log conversation creation.
2. THE system SHALL log message send without storing full message body in activity logs.
3. THE system SHALL log block and report actions.
4. THE send endpoint SHALL have a rate limit.
5. THE user search endpoint SHALL have a rate limit.
6. THE migration SHALL be additive and SHALL NOT modify existing Signal Ledger tables destructively.
7. THE mutation endpoints SHALL follow existing cookie/session protections and same-origin assumptions used by member APIs.
8. THE system SHALL not create or expose a DM UI implementation in this backend spec.
