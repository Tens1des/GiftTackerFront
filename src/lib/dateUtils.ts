/** Форматирует ISO8601 дату для отображения (локаль пользователя) */
export function formatDeadline(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Короткий формат для комментариев: 12.03.2025 */
export function formatCommentDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function isDeadlinePast(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}
