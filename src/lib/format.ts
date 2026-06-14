const dateFmt = new Intl.DateTimeFormat('he-IL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function formatDate(epochMs: number): string {
  return dateFmt.format(new Date(epochMs));
}
