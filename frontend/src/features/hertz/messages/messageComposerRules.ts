export type ShouldSendMessageInput = {
  key: string;
  shiftKey: boolean;
  body: string;
  attachmentCount: number;
  uploading: boolean;
  hasConversation: boolean;
};

export function shouldSendMessage(input: ShouldSendMessageInput): boolean {
  if (input.key !== 'Enter') return false;
  if (input.shiftKey) return false;
  if (!input.hasConversation) return false;
  if (input.uploading) return false;
  return input.body.trim().length > 0 || input.attachmentCount > 0;
}
