import type { Meta, StoryObj } from '@storybook/react'
import { Input, Textarea } from './Input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'you@example.com',
    type: 'email',
  },
}

export const WithHint: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    hint: 'Must be at least 8 characters long',
  },
}

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    error: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
}

const SearchIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const MailIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

export const WithLeftIcon: Story = {
  args: {
    placeholder: 'Search...',
    leftIcon: <SearchIcon />,
  },
}

export const WithRightIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'you@example.com',
    rightIcon: <MailIcon />,
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit this',
    disabled: true,
  },
}

// Textarea stories
export const TextareaDefault: Story = {
  render: () => (
    <div className="w-80">
      <Textarea placeholder="Enter your translation..." />
    </div>
  ),
}

export const TextareaWithLabel: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Your Translation"
        placeholder="Type your translation of the verse here..."
        hint="Try to capture the meaning as accurately as possible"
      />
    </div>
  ),
}

export const TextareaWithError: Story = {
  render: () => (
    <div className="w-80">
      <Textarea
        label="Translation"
        placeholder="Enter translation..."
        error="Translation cannot be empty"
      />
    </div>
  ),
}

export const FormExample: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Input label="Surah Number" type="number" placeholder="1-114" />
      <Input label="Verse Number" type="number" placeholder="1" />
      <Textarea label="Your Translation" placeholder="Enter your translation..." />
    </div>
  ),
}
