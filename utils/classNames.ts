/**
 * Utility for conditionally joining CSS class names together
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
} 