import type { Meta, StoryObj } from '@storybook/react'
import { VerseDisplay, VerseDisplaySkeleton } from './VerseDisplay'

const meta: Meta<typeof VerseDisplay> = {
  title: 'Components/VerseDisplay',
  component: VerseDisplay,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['default', 'memorized', 'perfect'],
    },
    colorizeWords: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const sampleVerse = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ'
const longVerse = 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ الرَّحْمَٰنِ الرَّحِيمِ مَالِكِ يَوْمِ الدِّينِ'

export const Default: Story = {
  args: {
    arabic: sampleVerse,
    surahName: 'Al-Fatihah',
    verseNumber: 1,
  },
}

export const Small: Story = {
  args: {
    arabic: sampleVerse,
    surahName: 'Al-Fatihah',
    verseNumber: 1,
    size: 'sm',
  },
}

export const Medium: Story = {
  args: {
    arabic: sampleVerse,
    surahName: 'Al-Fatihah',
    verseNumber: 1,
    size: 'md',
  },
}

export const Large: Story = {
  args: {
    arabic: sampleVerse,
    surahName: 'Al-Fatihah',
    verseNumber: 1,
    size: 'lg',
  },
}

export const ExtraLarge: Story = {
  args: {
    arabic: sampleVerse,
    surahName: 'Al-Fatihah',
    verseNumber: 1,
    size: 'xl',
  },
}

export const Memorized: Story = {
  args: {
    arabic: sampleVerse,
    surahName: 'Al-Fatihah',
    verseNumber: 1,
    variant: 'memorized',
  },
}

export const Perfect: Story = {
  args: {
    arabic: sampleVerse,
    surahName: 'Al-Fatihah',
    verseNumber: 1,
    variant: 'perfect',
  },
}

export const WithColorizedWords: Story = {
  args: {
    arabic: longVerse,
    surahName: 'Al-Fatihah',
    verseNumber: 2,
    colorizeWords: true,
  },
}

export const WithoutMetadata: Story = {
  args: {
    arabic: sampleVerse,
  },
}

export const LongVerse: Story = {
  args: {
    arabic: longVerse,
    surahName: 'Al-Fatihah',
    verseNumber: 2,
    size: 'lg',
  },
}

export const Skeleton: Story = {
  render: () => <VerseDisplaySkeleton className="w-full max-w-2xl" />,
}

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <VerseDisplay
        arabic={sampleVerse}
        surahName="Default Variant"
        verseNumber={1}
        variant="default"
      />
      <VerseDisplay
        arabic={sampleVerse}
        surahName="Memorized Variant"
        verseNumber={1}
        variant="memorized"
      />
      <VerseDisplay
        arabic={sampleVerse}
        surahName="Perfect Variant"
        verseNumber={1}
        variant="perfect"
      />
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-2xl">
      <VerseDisplay arabic={sampleVerse} surahName="Small" verseNumber={1} size="sm" />
      <VerseDisplay arabic={sampleVerse} surahName="Medium" verseNumber={1} size="md" />
      <VerseDisplay arabic={sampleVerse} surahName="Large" verseNumber={1} size="lg" />
      <VerseDisplay arabic={sampleVerse} surahName="Extra Large" verseNumber={1} size="xl" />
    </div>
  ),
}
