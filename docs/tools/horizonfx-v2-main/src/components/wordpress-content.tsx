'use client';

import { useEffect, useRef } from 'react';

interface WordPressContentProps {
  content: string;
}

export function WordPressContent({ content }: WordPressContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // Fix lazy-loaded images from WordPress
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => {
      // Remove lazy loading
      img.removeAttribute('loading');
      
      // If image has data-src (lazy load), move it to src
      const dataSrc = img.getAttribute('data-src');
      if (dataSrc) {
        img.src = dataSrc;
      }
      
      // If image has srcset with data-srcset, move it
      const dataSrcset = img.getAttribute('data-srcset');
      if (dataSrcset) {
        img.srcset = dataSrcset;
      }
      
      // Force eager loading
      img.loading = 'eager';
      
      // Add error handler
      img.onerror = () => {
        console.error('Failed to load image:', img.src);
      };
    });
  }, [content]);

  return (
    <div
      ref={contentRef}
      className="prose prose-lg max-w-none prose-gray dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:mt-12 prose-headings:mb-6 prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-8 prose-p:text-justify prose-img:rounded-lg prose-img:shadow-md prose-img:my-12 prose-img:mx-auto prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-strong:text-gray-900 dark:prose-strong:text-white prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20 prose-blockquote:p-6 prose-blockquote:rounded-lg prose-blockquote:my-8 prose-ul:my-8 prose-ol:my-8 prose-li:my-3 prose-li:leading-relaxed"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
