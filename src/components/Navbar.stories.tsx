import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Components/Navbar',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

const StaticNavbar = ({ activePath = '/', mobileMenuOpen = false }: { activePath?: string; mobileMenuOpen?: boolean }) => {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/browse', label: 'Browse' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return activePath === '/'
    return activePath.startsWith(href)
  }

  const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ')

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <a href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">Qalam</span>
            </a>
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive(link.href)
                      ? 'text-primary-700 bg-primary-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/foyzulkarim/qalam"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              aria-label="View on GitHub"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a
              href="/browse/surah/1/1"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              Quick Practice
            </a>

            <button
              type="button"
              className="sm:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'block px-4 py-3 rounded-lg text-base font-medium transition-colors',
                  isActive(link.href)
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                {link.label}
              </a>
            ))}
            <a
              href="/browse/surah/1/1"
              className="block px-4 py-3 rounded-lg text-base font-medium bg-primary-600 text-white text-center mt-2"
            >
              Quick Practice
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}

export const Default: Story = {
  render: () => <StaticNavbar />,
}

export const HomeActive: Story = {
  render: () => <StaticNavbar activePath="/" />,
}

export const BrowseActive: Story = {
  render: () => <StaticNavbar activePath="/browse" />,
}

export const MobileMenuOpen: Story = {
  render: () => <StaticNavbar mobileMenuOpen={true} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

export const MobileMenuClosed: Story = {
  render: () => <StaticNavbar mobileMenuOpen={false} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
}

export const TabletView: Story = {
  render: () => <StaticNavbar activePath="/browse" />,
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
}
