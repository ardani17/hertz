# Requirements Document

## Introduction

The Horizon Trader Platform's Telegram bot currently has redundant publishing commands (`/story`, `/cerita`) that overlap with the hashtag-based publishing system, unnecessary hashtag aliases (`#jurnal`, `#kehidupan`), a missing `#general` hashtag for the general category, and an unused `content_type` column in the articles table. This feature simplifies the bot by establishing a strict 1:1 mapping between hashtags and categories, removing redundant commands and aliases, adding the missing `#general` hashtag, and eliminating the unused `content_type` column from the schema and codebase.

## Glossary

- **Bot**: The Telegram bot service that processes messages from the Horizon Trader group chat and publishes articles to the platform
- **Hashtag_Handler**: The component that detects recognized hashtags in Telegram messages and creates articles in the corresponding category
- **Command_Registry**: The registry that maps slash commands and hashtag triggers to their handler implementations
- **Hashtag_Map**: The lookup table in `bot/src/utils/hashtag.ts` that maps hashtag strings to article categories
- **Article**: A content record in the `articles` database table, containing HTML content, a category, and metadata
- **Category**: A classification for articles; one of `trading`, `life_story`, `general`, or `outlook`
- **Content_Type**: The `content_type` column in the `articles` table, currently storing `'short'` or `'long'` values that the frontend does not use
- **Help_Handler**: The `/help` command handler that displays available commands and hashtags to the user
- **Publish_Handler**: The `/publish` admin-only command handler that publishes a replied-to message as an article
- **Credit_System**: The subsystem that awards credits to users when they publish articles, with amounts configured per category in the `credit_settings` table

## Requirements

### Requirement 1: Remove /story command

**User Story:** As a platform maintainer, I want to remove the `/story` command, so that users publish life_story articles exclusively via the `#cerita` hashtag (which already supports media).

#### Acceptance Criteria

1. WHEN a user sends a message starting with `/story`, THE Bot SHALL not recognize the message as a command and SHALL not create an article
2. THE Command_Registry SHALL not contain a handler registered for the `/story` command
3. WHEN the `/story` command is removed, THE Bot SHALL continue to create life_story articles when a message contains the `#cerita` hashtag

### Requirement 2: Remove /cerita command

**User Story:** As a platform maintainer, I want to remove the `/cerita` command, so that users publish life_story articles exclusively via the `#cerita` hashtag (which already supports media).

#### Acceptance Criteria

1. WHEN a user sends a message starting with `/cerita`, THE Bot SHALL not recognize the message as a command and SHALL not create an article
2. THE Command_Registry SHALL not contain a handler registered for the `/cerita` command
3. WHEN the `/cerita` command is removed, THE Bot SHALL continue to create life_story articles when a message contains the `#cerita` hashtag

### Requirement 3: Remove hashtag aliases

**User Story:** As a platform maintainer, I want to remove the `#jurnal` and `#kehidupan` hashtag aliases, so that each category has exactly one hashtag and the mapping is unambiguous.

#### Acceptance Criteria

1. THE Hashtag_Map SHALL not contain an entry for the hashtag `jurnal`
2. THE Hashtag_Map SHALL not contain an entry for the hashtag `kehidupan`
3. WHEN a user sends a message containing only `#jurnal` or `#kehidupan` (with no other recognized hashtag), THE Hashtag_Handler SHALL treat the message as having no recognized hashtag and map it to the `general` category
4. THE Hashtag_Map SHALL contain exactly three entries: `trading` mapping to `trading`, `cerita` mapping to `life_story`, and `general` mapping to `general`

### Requirement 4: Add #general hashtag

**User Story:** As a user, I want to use the `#general` hashtag to publish general-category articles from Telegram, so that I can earn credits for general content.

#### Acceptance Criteria

1. WHEN a user sends a message containing the `#general` hashtag, THE Hashtag_Handler SHALL create an article with category `general`
2. WHEN a user sends a message containing the `#general` hashtag, THE Credit_System SHALL award the user the credit amount configured for the `general` category (currently 3 credits)
3. THE Command_Registry SHALL contain a hashtag handler registered for `#general`
4. WHEN a user sends a message containing `#general` with a photo or video attachment, THE Hashtag_Handler SHALL upload and attach the media to the created article

### Requirement 5: Enforce 1:1 hashtag-to-category mapping

**User Story:** As a platform maintainer, I want each article category to map to exactly one hashtag, so that the publishing interface is simple and unambiguous.

#### Acceptance Criteria

1. THE Hashtag_Map SHALL map `#trading` exclusively to the `trading` category
2. THE Hashtag_Map SHALL map `#cerita` exclusively to the `life_story` category
3. THE Hashtag_Map SHALL map `#general` exclusively to the `general` category
4. THE Hashtag_Map SHALL not contain any hashtag that maps to the `outlook` category
5. WHEN a message contains multiple recognized hashtags, THE Hashtag_Handler SHALL use the first recognized hashtag to determine the category

### Requirement 6: Remove content_type column from schema

**User Story:** As a platform maintainer, I want to remove the unused `content_type` column from the articles table, so that the schema does not contain dead fields.

#### Acceptance Criteria

1. THE articles database table SHALL not contain a `content_type` column
2. THE database migration that removes the `content_type` column SHALL use `ALTER TABLE articles DROP COLUMN content_type`
3. WHEN the `content_type` column is removed, THE Bot SHALL insert articles without specifying a `content_type` value
4. WHEN the `content_type` column is removed, THE frontend SHALL query articles without selecting or filtering on `content_type`

### Requirement 7: Remove content_type from application code

**User Story:** As a platform maintainer, I want to remove all references to `content_type` from the application code, so that the codebase stays consistent with the schema.

#### Acceptance Criteria

1. THE `ContentType` type definition in `shared/types/index.ts` SHALL be removed
2. THE `Article` interface in `shared/types/index.ts` SHALL not include a `content_type` field
3. THE Hashtag_Handler SHALL not pass a `content_type` value when inserting articles
4. THE Publish_Handler SHALL not pass a `content_type` value when inserting articles
5. THE `insertArticle` function in `bot/src/index.ts` SHALL not include `content_type` in its parameter type or SQL INSERT statement
6. WHEN any frontend component or API route references `content_type`, THE reference SHALL be removed

### Requirement 8: Update /help command output

**User Story:** As a user, I want the `/help` command to show the current set of available commands and hashtags, so that I know how to publish articles.

#### Acceptance Criteria

1. WHEN a user sends `/help`, THE Help_Handler SHALL not list `/story` or `/cerita` as available commands
2. WHEN a user sends `/help`, THE Help_Handler SHALL list `#trading`, `#cerita`, and `#general` as available hashtags
3. WHEN a user sends `/help`, THE Help_Handler SHALL list `/publish` and `/help` as available commands

### Requirement 9: Preserve existing /publish behavior

**User Story:** As an admin, I want the `/publish` command to continue working as before, so that I can still publish replied-to messages.

#### Acceptance Criteria

1. WHEN an admin replies to a message with `/publish`, THE Publish_Handler SHALL create an article from the replied-to message content
2. WHEN a non-admin user sends `/publish`, THE Publish_Handler SHALL reply with a message indicating only admins can use the command
3. WHEN the replied-to message contains a recognized hashtag, THE Publish_Handler SHALL use that hashtag to determine the article category
4. WHEN the replied-to message contains no recognized hashtag, THE Publish_Handler SHALL default the article category to `general`
5. WHEN the `/publish` command is used, THE Publish_Handler SHALL not pass a `content_type` value when inserting the article

### Requirement 10: Strip recognized hashtags from article content

**User Story:** As a user, I want recognized hashtags (like `#trading`) to be removed from the published article content, so that the article text is clean and only contains the actual message.

#### Acceptance Criteria

1. WHEN the Hashtag_Handler processes a message, THE recognized hashtags (`#trading`, `#cerita`, `#general`) SHALL be removed from the text before converting to HTML
2. WHEN a message contains `#trading Hari ini saya belajar tentang support`, THE article content_html SHALL contain `Hari ini saya belajar tentang support` without the `#trading` text
3. WHEN a message contains a recognized hashtag in the middle of text, THE hashtag SHALL be removed and surrounding whitespace SHALL be normalized (no double spaces)
4. WHEN a message contains unrecognized hashtags (e.g., `#bitcoin`), THE unrecognized hashtags SHALL be preserved in the article content
5. WHEN the Publish_Handler processes a replied-to message, THE recognized hashtags SHALL also be stripped from the article content

### Requirement 11: Delete handler source files

**User Story:** As a platform maintainer, I want the source files for removed commands to be deleted, so that dead code does not remain in the repository.

#### Acceptance Criteria

1. THE file `bot/src/handlers/storyHandler.ts` SHALL be deleted from the repository
2. THE file `bot/src/handlers/ceritaHandler.ts` SHALL be deleted from the repository
3. WHEN the handler files are deleted, THE Bot entry point (`bot/src/index.ts`) SHALL not import from `storyHandler` or `ceritaHandler`
