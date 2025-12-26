import type { Meta, StoryObj } from '@storybook/react'
import { FeedbackCard, FeedbackCardSkeleton } from './FeedbackCard'
import type { AttemptFeedback } from '@/types'

const meta: Meta<typeof FeedbackCard> = {
  title: 'Components/FeedbackCard',
  component: FeedbackCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const excellentFeedback: AttemptFeedback = {
  overallScore: 0.95,
  correctElements: [
    'Accurate translation of "Bismillah" as "In the name of Allah"',
    'Correct understanding of "Al-Rahman" as "The Most Gracious"',
    'Proper rendering of "Al-Raheem" as "The Most Merciful"',
  ],
  missedElements: [],
  suggestions: [
    'Consider adding "The" before "Most Gracious" for formal style',
  ],
  encouragement: 'Excellent work! Your understanding of this foundational verse is outstanding.',
}

const goodFeedback: AttemptFeedback = {
  overallScore: 0.75,
  correctElements: [
    'Core meaning captured correctly',
    'Good understanding of divine attributes',
  ],
  missedElements: [
    'The specific meaning of "Rahman" (immediate mercy) vs "Raheem" (lasting mercy)',
  ],
  suggestions: [
    'Study the linguistic difference between Rahman and Raheem',
    'Practice with more verses containing these attributes',
  ],
  encouragement: 'Good effort! You have a solid foundation to build upon.',
}

const needsWorkFeedback: AttemptFeedback = {
  overallScore: 0.55,
  correctElements: [
    'Basic structure understood',
  ],
  missedElements: [
    'Missing "In the name of" at the beginning',
    'Incomplete translation of mercy attributes',
    'Word order needs adjustment',
  ],
  suggestions: [
    'Review the meaning of each word individually',
    'Practice translating word by word first',
    'Listen to recitations to internalize the structure',
  ],
  encouragement: 'Keep practicing! Every attempt brings you closer to mastery.',
}

const poorFeedback: AttemptFeedback = {
  overallScore: 0.3,
  correctElements: [
    'Attempted translation shows effort',
  ],
  missedElements: [
    'Core meaning not captured',
    'Key words mistranslated',
    'Structure significantly different from original',
  ],
  suggestions: [
    'Start with the word-by-word analysis',
    'Focus on understanding root words',
    'Review basic Arabic-English correspondences',
    'Consider using the hint feature for guidance',
  ],
  encouragement: 'Learning takes time. Focus on understanding one word at a time.',
}

export const Excellent: Story = {
  args: {
    feedback: excellentFeedback,
  },
}

export const Good: Story = {
  args: {
    feedback: goodFeedback,
  },
}

export const NeedsWork: Story = {
  args: {
    feedback: needsWorkFeedback,
  },
}

export const Poor: Story = {
  args: {
    feedback: poorFeedback,
  },
}

export const Skeleton: Story = {
  render: () => <FeedbackCardSkeleton className="w-full max-w-lg" />,
}

export const AllScoreLevels: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-lg">
      <FeedbackCard feedback={excellentFeedback} />
      <FeedbackCard feedback={goodFeedback} />
      <FeedbackCard feedback={needsWorkFeedback} />
      <FeedbackCard feedback={poorFeedback} />
    </div>
  ),
}

export const MinimalFeedback: Story = {
  args: {
    feedback: {
      overallScore: 0.8,
      correctElements: ['Good translation'],
      missedElements: [],
      suggestions: [],
      encouragement: 'Well done!',
    },
  },
}
