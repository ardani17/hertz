import type { Meta, StoryObj } from '@storybook/react';
import { SkeletonLoader } from './SkeletonLoader';

const meta = {
  title: 'UI/SkeletonLoader',
  component: SkeletonLoader,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof SkeletonLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Feed: Story = {
  args: { variant: 'feed' },
};

export const Gallery: Story = {
  args: { variant: 'gallery' },
};

export const Article: Story = {
  args: { variant: 'article' },
};
