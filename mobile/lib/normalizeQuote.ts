import type { QuoteRequest } from '@/lib/types';

export function normalizeQuote(
  quote: QuoteRequest & { status?: QuoteRequest['quoteStatus'] }
): QuoteRequest {
  if (quote.quoteStatus) return quote;
  if (quote.status) {
    const { status, ...rest } = quote;
    return { ...rest, quoteStatus: status };
  }
  return { ...quote, quoteStatus: 'new' };
}
