import type { Meta, StoryObj } from '@storybook/react';
import { ErrorPage } from './ErrorPage';

const meta = {
  title: 'UI/ErrorPage',
  component: ErrorPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
} satisfies Meta<typeof ErrorPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotFound: Story = {
  args: { statusCode: 404 },
};

export const ServerError: Story = {
  args: { statusCode: 500, onRetry: () => undefined },
};

export const Forbidden: Story = {
  args: { statusCode: 403 },
};
