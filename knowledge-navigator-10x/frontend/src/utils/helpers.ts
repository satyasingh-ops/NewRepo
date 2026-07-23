import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format date to readable string */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/** Format date to relative time */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/** Generate unique ID */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/** Truncate text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/** Get domain color */
export function getDomainColor(domainId: string): string {
  const colors: Record<string, string> = {
    operations: '#0052cc',
    automation: '#7c3aed',
    risk: '#dc2626',
    controls: '#059669',
    audit: '#0891b2',
    compliance: '#7c3aed',
    governance: '#d97706',
    euda: '#0e7490',
    learning: '#16a34a',
    hr: '#db2777',
  };
  return colors[domainId] || '#0052cc';
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  }
}

/** Export chat to PDF */
export async function exportToPDF(content: string, filename: string = 'chat-export'): Promise<void> {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(content.replace(/[\u0080-\uffff]/g, '?'), 180);
    let y = 20;
    doc.setFontSize(16);
    doc.text('Knowledge Navigator 10X - Chat Export', 15, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, y);
    y += 10;
    doc.setFontSize(11);
    splitText.forEach((line: string) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 15, y);
      y += 6;
    });
    doc.save(`${filename}.pdf`);
  } catch (e) {
    console.error('PDF export failed:', e);
  }
}

/** Detect dark mode preference */
export function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Priority badge color */
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high': return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
    case 'medium': return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30';
    case 'low': return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30';
    default: return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30';
  }
}
