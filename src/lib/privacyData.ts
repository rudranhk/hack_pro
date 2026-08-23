import { Activity, Droplet, History, MapPin, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface PrivacyField {
  icon: LucideIcon
  label: string
  /** Why this is stored, from the donor's own point of view. */
  donorWhy: string
  /** What a hospital actually sees of this field — and what it never sees. */
  hospitalWhy: string
}

export const privacyFields: PrivacyField[] = [
  {
    icon: Droplet,
    label: 'Blood group',
    donorWhy: 'Used to filter which emergency requests you can even be alerted for.',
    hospitalWhy: "Shown for every ranked candidate — it's required to confirm compatibility.",
  },
  {
    icon: ShieldCheck,
    label: 'Eligibility information',
    donorWhy:
      'Your last-donation date and cooldown status, so the system only alerts you when you can safely donate.',
    hospitalWhy: 'Shown only as a pass/fail signal ("cleared for this request") — never your raw screening answers.',
  },
  {
    icon: MapPin,
    label: 'Approximate location',
    donorWhy: 'Used to estimate distance to a hospital — never your exact address or live position.',
    hospitalWhy: 'Shown as distance only (e.g. "1.8 km away") — never an exact address or live position.',
  },
  {
    icon: History,
    label: 'Donation history',
    donorWhy: 'Confirmed past donations, so hospitals see a verified, responsive record — not a medical history.',
    hospitalWhy: 'Shown as a donation count and recency, not a full medical or personal history.',
  },
  {
    icon: Activity,
    label: 'Response history',
    donorWhy: 'How often you respond to alerts — part of the response-propensity ranking that decides who gets alerted first.',
    hospitalWhy: 'Shown as a response-rate percentage feeding the match score — never individual message logs.',
  },
]
