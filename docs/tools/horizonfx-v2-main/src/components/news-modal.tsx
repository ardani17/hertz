"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { sanitizeNewsContent, isContentSafe } from "@/lib/security";

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: string;
}

export function NewsModal({ isOpen, onClose, title, body }: NewsModalProps) {
  // Sanitize content for safe display
  const sanitizedContent = sanitizeNewsContent({ title, body, providerId: '' });
  
  // Additional safety check
  const isSafe = isContentSafe(title) && isContentSafe(body);
  
  if (!isSafe) {
    console.warn('Potentially unsafe content detected in news modal');
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-left mb-4">
            {sanitizedContent.title}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="prose prose-base max-w-none dark:prose-invert text-left">
            <div 
              className="text-sm leading-relaxed space-y-4 text-left"
              style={{
                whiteSpace: 'pre-line',
                lineHeight: '1.6',
                textAlign: 'left'
              }}
              dangerouslySetInnerHTML={{
                __html: sanitizedContent.body
                  .replace(/\n\n/g, '</p><p class="mb-4">')
                  .replace(/^/, '<p class="mb-4">')
                  .replace(/$/, '</p>')
                  .replace(/\. ([A-Z])/g, '. </p><p class="mb-4">$1')
              }}
            />
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}