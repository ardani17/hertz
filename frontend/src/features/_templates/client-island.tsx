'use client';

/**
 * Template: client island — hooks, events, browser APIs only.
 * Parent server page passes serializable props.
 */
export function ExampleClientIsland({ label }: { label: string }) {
  return <span>{label}</span>;
}
