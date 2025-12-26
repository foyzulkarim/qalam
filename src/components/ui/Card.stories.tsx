import type { Meta, StoryObj } from '@storybook/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardSkeleton } from './Card'
import { Button } from './Button'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    hover: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'This is a card with default styling.',
    padding: 'md',
  },
}

export const WithHover: Story = {
  args: {
    children: 'Hover over this card to see the effect.',
    hover: true,
  },
}

export const SmallPadding: Story = {
  args: {
    children: 'Card with small padding.',
    padding: 'sm',
  },
}

export const LargePadding: Story = {
  args: {
    children: 'Card with large padding.',
    padding: 'lg',
  },
}

export const NoPadding: Story = {
  args: {
    children: (
      <div className="p-6">
        <p>Card with no built-in padding (content adds its own).</p>
      </div>
    ),
    padding: 'none',
  },
}

export const WithSubcomponents: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>This is a description of the card content.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">
          This is the main content area of the card where you can put any content.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">Action</Button>
      </CardFooter>
    </Card>
  ),
}

export const SurahCard: Story = {
  render: () => (
    <Card hover className="w-80">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Al-Fatihah</CardTitle>
            <CardDescription>The Opening</CardDescription>
          </div>
          <span className="text-2xl font-arabic">الفاتحة</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm text-gray-500">
          <span>7 verses</span>
          <span>Meccan</span>
        </div>
      </CardContent>
    </Card>
  ),
}

export const Skeleton: Story = {
  render: () => <CardSkeleton className="w-80" />,
}

export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <Card hover>
        <CardHeader>
          <CardTitle>Card 1</CardTitle>
        </CardHeader>
        <CardContent>Content for card 1</CardContent>
      </Card>
      <Card hover>
        <CardHeader>
          <CardTitle>Card 2</CardTitle>
        </CardHeader>
        <CardContent>Content for card 2</CardContent>
      </Card>
      <Card hover>
        <CardHeader>
          <CardTitle>Card 3</CardTitle>
        </CardHeader>
        <CardContent>Content for card 3</CardContent>
      </Card>
      <Card hover>
        <CardHeader>
          <CardTitle>Card 4</CardTitle>
        </CardHeader>
        <CardContent>Content for card 4</CardContent>
      </Card>
    </div>
  ),
}
