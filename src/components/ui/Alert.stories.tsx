import type { Meta, StoryObj } from '@storybook/react'
import { Alert } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'This is an informational message.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Your translation has been submitted successfully!',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Please review your translation before submitting.',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Failed to load verse data. Please try again.',
  },
}

export const WithTitle: Story = {
  args: {
    variant: 'info',
    title: 'Practice Tip',
    children: 'Focus on understanding the meaning of each word before translating the full verse.',
  },
}

export const Dismissible: Story = {
  args: {
    variant: 'success',
    title: 'Great Progress!',
    children: 'You have completed 10 verses today.',
    onDismiss: () => alert('Dismissed!'),
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-96">
      <Alert variant="info" title="Information">
        This provides helpful context or tips.
      </Alert>
      <Alert variant="success" title="Success">
        Your action was completed successfully.
      </Alert>
      <Alert variant="warning" title="Warning">
        Please be aware of this important information.
      </Alert>
      <Alert variant="error" title="Error">
        Something went wrong. Please try again.
      </Alert>
    </div>
  ),
}

export const LongContent: Story = {
  args: {
    variant: 'info',
    title: 'About Translation Practice',
    children:
      'When practicing Quran translation, focus on understanding the root words and their meanings. Pay attention to the grammatical structure and how particles affect the meaning. Remember that Arabic often conveys ideas that may require more words in English to fully express.',
  },
}
