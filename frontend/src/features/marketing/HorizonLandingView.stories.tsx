import type { Meta, StoryObj } from '@storybook/react';
import { HorizonLandingView } from './HorizonLandingView';

const meta: Meta<typeof HorizonLandingView> = {
  title: 'Marketing/HorizonLandingView',
  component: HorizonLandingView,
};

export default meta;
type Story = StoryObj<typeof HorizonLandingView>;

export const EmptyMarket: Story = {
  args: {
    previewPost: null,
    marketGroups: [],
  },
};
