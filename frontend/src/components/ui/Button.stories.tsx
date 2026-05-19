import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { children: 'Simpan perubahan' },
};

export const Outline: Story = {
  args: { children: 'Batal', variant: 'outline' },
};

export const Destructive: Story = {
  args: { children: 'Hapus post', variant: 'destructive' },
};

export const Disabled: Story = {
  args: { children: 'Memproses...', disabled: true },
};
