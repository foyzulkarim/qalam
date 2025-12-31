import type { Meta, StoryObj } from '@storybook/react'
import { Spinner, LoadingScreen, LoadingPlaceholder } from './Spinner'

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: {
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <Spinner size="sm" />
        <p className="mt-2 text-sm text-gray-500">Small</p>
      </div>
      <div className="text-center">
        <Spinner size="md" />
        <p className="mt-2 text-sm text-gray-500">Medium</p>
      </div>
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-2 text-sm text-gray-500">Large</p>
      </div>
    </div>
  ),
}

export const LoadingPlaceholderStory: Story = {
  render: () => (
    <div className="w-80 border border-gray-200 rounded-lg">
      <LoadingPlaceholder />
    </div>
  ),
  name: 'Loading Placeholder',
}

export const LoadingScreenStory: Story = {
  render: () => (
    <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden">
      <LoadingScreen message="Loading verse data..." />
    </div>
  ),
  name: 'Loading Screen',
  parameters: {
    layout: 'fullscreen',
  },
}

export const InButton: Story = {
  render: () => (
    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg">
      <Spinner size="sm" className="border-white border-t-transparent" />
      <span>Submitting...</span>
    </button>
  ),
}
