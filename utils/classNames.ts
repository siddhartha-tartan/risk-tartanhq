/**
 * Utility for conditionally joining CSS class names together
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Alias for classNames - shorter and more convenient
 */
export const cn = classNames; 