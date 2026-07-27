export function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  const h = match?.[1] ? `${match[1]}h` : '';
  const m = match?.[2] ? `${match[2]}m` : '';
  return [h, m].filter(Boolean).join(' ') || iso;
}

export function formatTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateTime: string): string {
  return new Date(dateTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatMoney(currency: string, amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return `${currency} ${Math.round(value).toLocaleString()}`;
}

export function formatLayover(arrival: string, nextDeparture: string): string {
  const minutes = Math.round((new Date(nextDeparture).getTime() - new Date(arrival).getTime()) / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h}h` : '', m ? `${m}m` : ''].filter(Boolean).join(' ') || `${minutes}m`;
}
