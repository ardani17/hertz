import type { Preview } from '@storybook/react';
import React from 'react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'hertz-dark',
      values: [
        { name: 'hertz-dark', value: '#0f0f14' },
        { name: 'hertz-surface', value: '#141414' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" className="dark" style={{ minWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
