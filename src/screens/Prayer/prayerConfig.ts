import type { PrayerCategory, PrayerStatus } from '../../types/prayer';

export type CategoryMeta = {
  label: string;
  icon: string;
  color: string;
};

export type StatusMeta = {
  label: string;
  icon: string;
  color: string;
  emoji: string;
};

export const CATEGORY_META: Record<PrayerCategory, CategoryMeta> = {
  family:        { label: 'Family',        icon: 'people-outline',          color: '#C9A96B' },
  health:        { label: 'Health',        icon: 'heart-outline',           color: '#72B576' },
  work:          { label: 'Work',          icon: 'briefcase-outline',       color: '#7B8FA0' },
  school:        { label: 'School',        icon: 'school-outline',          color: '#9B7BB8' },
  relationships: { label: 'Relationships', icon: 'heart-circle-outline',   color: '#C47B8A' },
  church:        { label: 'Church',        icon: 'home-outline',            color: '#8B7355' },
  thanksgiving:  { label: 'Thanksgiving',  icon: 'sparkles-outline',        color: '#D4A843' },
  guidance:      { label: 'Guidance',      icon: 'compass-outline',         color: '#5B9BD5' },
  healing:       { label: 'Healing',       icon: 'medkit-outline',          color: '#5DAE72' },
  finances:      { label: 'Finances',      icon: 'wallet-outline',          color: '#8A9B6E' },
  salvation:     { label: 'Salvation',     icon: 'sunny-outline',           color: '#D4A843' },
  mission:       { label: 'Mission',       icon: 'globe-outline',           color: '#6B8FA0' },
  other:         { label: 'Other',         icon: 'ellipsis-horizontal-outline', color: '#9A8E83' },
};

export const STATUS_META: Record<PrayerStatus, StatusMeta> = {
  active:   { label: 'Active',   icon: 'radio-button-on-outline', color: '#6E8B74', emoji: '🙏' },
  waiting:  { label: 'Waiting',  icon: 'time-outline',            color: '#C9A96B', emoji: '⏳' },
  answered: { label: 'Answered', icon: 'checkmark-circle-outline',color: '#5B9BD5', emoji: '✨' },
  ongoing:  { label: 'Ongoing',  icon: 'infinite-outline',        color: '#C47B8A', emoji: '❤️' },
};

export const PRAYER_CATEGORIES: PrayerCategory[] = [
  'family', 'health', 'work', 'school', 'relationships',
  'church', 'thanksgiving', 'guidance', 'healing', 'finances',
  'salvation', 'mission', 'other',
];

export const PRAYER_STATUSES: PrayerStatus[] = ['active', 'waiting', 'answered', 'ongoing'];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}

export function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export function daysBetween(from: string, to: string): number {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}
