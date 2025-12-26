import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './ui/Button'

// Since StartPracticeLink uses Next.js hooks, we create static representations
const meta: Meta = {
  title: 'Components/StartPracticeLink',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

// Static representation for Storybook
const StaticStartPracticeLink = ({
  variant = 'secondary',
  size = 'md',
  asText = false,
  children,
}: {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  asText?: boolean
  children: React.ReactNode
}) => {
  const href = '/browse/surah/1/1'

  if (asText) {
    return (
      <a href={href} className="text-primary-600 hover:text-primary-700 underline">
        {children}
      </a>
    )
  }

  return (
    <a href={href}>
      <Button variant={variant} size={size}>
        {children}
      </Button>
    </a>
  )
}

export const Default: Story = {
  render: () => (
    <StaticStartPracticeLink>
      Start Practice
    </StaticStartPracticeLink>
  ),
}

export const Primary: Story = {
  render: () => (
    <StaticStartPracticeLink variant="primary">
      Begin Learning
    </StaticStartPracticeLink>
  ),
}

export const Secondary: Story = {
  render: () => (
    <StaticStartPracticeLink variant="secondary">
      Continue Practice
    </StaticStartPracticeLink>
  ),
}

export const Outline: Story = {
  render: () => (
    <StaticStartPracticeLink variant="outline">
      Resume Session
    </StaticStartPracticeLink>
  ),
}

export const Small: Story = {
  render: () => (
    <StaticStartPracticeLink size="sm">
      Quick Start
    </StaticStartPracticeLink>
  ),
}

export const Large: Story = {
  render: () => (
    <StaticStartPracticeLink size="lg">
      Start Your Journey
    </StaticStartPracticeLink>
  ),
}

export const AsTextLink: Story = {
  render: () => (
    <p className="text-gray-600">
      Ready to practice?{' '}
      <StaticStartPracticeLink asText>
        Click here to start
      </StaticStartPracticeLink>
    </p>
  ),
}

export const InContext: Story = {
  render: () => (
    <div className="text-center p-8 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 rounded-xl">
      <h1 className="text-3xl font-bold text-white mb-4">Welcome to Qalam</h1>
      <p className="text-primary-100 mb-6">Practice translating Quran verses and improve your understanding.</p>
      <StaticStartPracticeLink variant="secondary" size="lg">
        Start Practice
      </StaticStartPracticeLink>
    </div>
  ),
}
