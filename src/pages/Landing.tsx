import { BrandHomeLink } from '@/components/layout/BrandHomeLink'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  Filter,
  HeartHandshake,
  Lock,
  Milestone,
  Radar,
  ShieldCheck,
} from 'lucide-react'
import { buttonClasses } from '@/components/ui/Button'

const trustItems = [
  {
    icon: ShieldCheck,
    title: 'Hospital workspace',
    description: 'A synthetic hospital coordinates requests, invitations and collections.',
  },
  {
    icon: Filter,
    title: 'Eligibility-first matching',
    description: 'Donors are filtered against eligibility rules before anyone gets alerted.',
  },
  {
    icon: Radar,
    title: 'Real-time request tracking',
    description: 'Every request moves through a visible status, not a black box.',
  },
  {
    icon: Lock,
    title: 'Privacy-conscious design',
    description: 'The demo uses anonymous donor IDs and stores no personal contact details.',
  },
]

export function Landing() {
  return (
    <div className="min-h-svh bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <BrandHomeLink>
            <span className="text-[15px] font-semibold text-ink">Blood Buddy</span>
          </BrandHomeLink>
          <nav className="flex items-center gap-2">
            <Link to="/hospital" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
              Hospital demo
            </Link>
            <Link to="/donor" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
              Donor demo
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-4xl px-5 pb-16 pt-16 text-center sm:px-8 sm:pt-24">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary-subtle-border bg-primary-subtle px-3 py-1 text-[12px] font-medium text-primary-active">
            Local demonstration · Synthetic donor network
          </span>
          <h1 className="text-[36px] font-semibold leading-[1.1] tracking-tight text-ink sm:text-[52px]">
            Find the right donor.
            <br />
            <span className="text-primary">Before the clock runs out.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-secondary sm:text-[16px]">
            An intelligent emergency blood coordination network that filters, ranks and alerts
            eligible donors when hospitals need blood fast.
          </p>

          <div className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
            <Link
              to="/hospital"
              className="group flex flex-col items-start rounded-lg border border-border bg-surface p-6 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-secondary hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-secondary text-white">
                <Building2 size={20} strokeWidth={1.75} />
              </span>
              <span className="mt-4 text-[15px] font-semibold text-ink">I'm a hospital</span>
              <span className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">
                Raise a synthetic emergency request and track matching in real time.
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-secondary">
                Enter hospital dashboard
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            <Link
              to="/donor"
              className="group flex flex-col items-start rounded-lg border border-border bg-surface p-6 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-white">
                <HeartHandshake size={20} strokeWidth={1.75} />
              </span>
              <span className="mt-4 text-[15px] font-semibold text-ink">I'm a donor</span>
              <span className="mt-1.5 text-[13px] leading-relaxed text-ink-secondary">
                Get notified only when you're truly needed, and see exactly why.
              </span>
              <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-primary">
                Enter donor app
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {trustItems.map((item) => (
                <div key={item.title} className="flex flex-col items-start">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-surface-sunken text-ink-secondary">
                    <item.icon size={18} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-3.5 text-[13.5px] font-semibold text-ink">{item.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-secondary">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
          <div className="flex items-start gap-3 rounded-lg border border-dashed border-border-strong px-5 py-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-ink-tertiary">
              <Milestone size={15} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
                Roadmap · Future: Organ Donation Network
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-secondary">
                Organ allocation remains within the official transplant network — this platform doesn't perform
                it and never will pretend to. Future versions may support donor pledge discovery and hospital
                handoff, nothing more.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-8 text-[12px] text-ink-tertiary sm:px-8">
          <p>Local demonstration with synthetic records. Metrics reflect actions in your workspace.</p>
          <p>&copy; {new Date().getFullYear()} Blood Buddy. Not a substitute for official blood-bank systems.</p>
        </div>
      </footer>
    </div>
  )
}
