'use client';

import { HertzLayout } from '@/components/layout/HertzLayout';
import { HertzTelegramLogin } from '@/components/feed/HertzTelegramLogin';
import { useTypingStatus } from '@/lib/swr/hooks/useTypingStatus';
import { ConversationList } from './ConversationList';
import { getDmAccessState } from './dm-utils';
import { MessageComposer } from './MessageComposer';
import { MessageThread } from './MessageThread';
import { useMessages } from './useMessages';
import styles from './messages.module.css';

function formatTypingLabel(names: string[]) {
  if (names.length === 0) return null;
  if (names.length === 1) return `${names[0]} sedang mengetik…`;
  if (names.length === 2) return `${names[0]} dan ${names[1]} sedang mengetik…`;
  return `${names[0]} dan ${names.length - 1} lainnya sedang mengetik…`;
}

export function MessagesView() {
  const dm = useMessages();
  const accessState = getDmAccessState(dm.currentUser);
  const typing = useTypingStatus(dm.activeId, dm.authState === 'member');
  const typingNames = (typing.data?.typingUsers ?? []).slice(0, 3).map((user) => user.displayName);
  const typingLabel = formatTypingLabel(typingNames);

  return (
    <HertzLayout
      variant="page"
      active="messages"
      title="Pesan"
      description="Chat privat antar member HERTZ."
      currentUser={dm.currentUser}
      hideRightRail
      fillViewport
    >
      {dm.authState !== 'member' ? (
        <div className={styles.dmPageShell}>
          <section className={styles.guestPanel}>
            <span>{dm.authState === 'loading' ? 'Memuat sesi...' : 'Mode tamu'}</span>
            <h2>{accessState.title}</h2>
            <p>{accessState.body}</p>
            {dm.authState === 'guest' ? <HertzTelegramLogin /> : null}
          </section>
        </div>
      ) : (
        <div className={styles.dmPageShell}>
          <div
            data-testid="dm-layout"
            data-mobile-thread-open={dm.mobileThreadOpen ? 'true' : undefined}
            className={`${styles.dmLayout} ${dm.mobileThreadOpen ? styles.threadOpen : ''}`}
          >
            <ConversationList
            conversations={dm.conversations}
            members={dm.members}
            activeId={dm.activeId}
            query={dm.query}
            filter={dm.filter}
            status={dm.status}
            onFilterChange={dm.setFilter}
            onSearch={(value) => void dm.searchMembers(value)}
            onSelectConversation={(id) => {
              dm.setActiveId(id);
              dm.setMobileThreadOpen(true);
            }}
            onStartConversation={(id) => void dm.startConversation(id)}
            />
            <MessageThread
            activeId={dm.activeId}
            activeConversation={dm.activeConversation}
            messages={dm.messages}
            currentUserId={dm.currentUser?.id}
            threadMenuOpen={dm.threadMenuOpen}
            filter={dm.filter}
            isLoading={dm.threadLoading}
            typingLabel={typingLabel}
            onBack={() => dm.setMobileThreadOpen(false)}
            onToggleMenu={() => dm.setThreadMenuOpen((value) => !value)}
            onArchive={(archived) => {
              dm.setThreadMenuOpen(false);
              void dm.archiveConversation(archived);
            }}
            onBlock={() => {
              dm.setThreadMenuOpen(false);
              void dm.blockPeer();
            }}
            onDeleteMessage={(id) => void dm.deleteMessage(id)}
            onReportMessage={(id) => void dm.reportMessage(id)}
            composer={
              <MessageComposer
                activeId={dm.activeId}
                body={dm.body}
                attachments={dm.attachments}
                uploading={dm.uploading}
                textareaRef={dm.composerRef}
                onBodyChange={dm.setBody}
                onSend={() => void dm.send()}
                onUpload={(files) => void dm.uploadImages(files)}
                onRemoveAttachment={(fileUrl) =>
                  dm.setAttachments((items) => items.filter((item) => item.fileUrl !== fileUrl))
                }
              />
            }
            />
          </div>
        </div>
      )}
    </HertzLayout>
  );
}
