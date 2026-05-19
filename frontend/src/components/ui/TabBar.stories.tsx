import type { Meta, StoryObj } from '@storybook/react';
import { TabBar } from './TabBar';

const meta: Meta<typeof TabBar> = {
  title: 'UI/TabBar',
  component: TabBar,
};

export default meta;
type Story = StoryObj<typeof TabBar>;

export const Default: Story = {
  args: {
    ariaLabel: 'Kategori feed',
    items: [
      { id: 'latest', label: 'Terbaru', href: '/hertz', active: true },
      { id: 'trading', label: 'Trading', href: '/hertz?category=trading_room' },
      { id: 'life', label: 'Life', href: '/hertz?category=life_coffee' },
    ],
  },
};
