export { shouldSendMessage as shouldSend, shouldSendMessage } from './messageComposerRules';

export function shouldInsertNewline(input: { key: string; shiftKey: boolean }): boolean {
  return input.key === 'Enter' && input.shiftKey;
}
