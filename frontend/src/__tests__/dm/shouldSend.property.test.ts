import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { shouldSendMessage } from '@/features/hertz/messages/messageComposerRules';

// Feature: hertz-social-ux-uplift, Property 6: Composer send predicate

describe('shouldSendMessage', () => {
  it('sends only when Enter has content/attachments and no upload is active', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.integer({ min: 0, max: 4 }),
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (body, attachmentCount, uploading, shiftKey, hasConversation) => {
          const result = shouldSendMessage({
            key: 'Enter',
            shiftKey,
            body,
            attachmentCount,
            uploading,
            hasConversation,
          });
          expect(result).toBe(
            hasConversation && !uploading && !shiftKey && (body.trim().length > 0 || attachmentCount > 0),
          );
        },
      ),
    );
  });

  it('never sends for non-Enter keys', () => {
    fc.assert(
      fc.property(fc.string().filter((key) => key !== 'Enter'), (key) => {
        expect(shouldSendMessage({ key, shiftKey: false, body: 'hi', attachmentCount: 0, uploading: false, hasConversation: true })).toBe(false);
      }),
    );
  });
});
