import type { QuoteRequest } from '@/lib/types';

type RawQuote = QuoteRequest & {
  status?: QuoteRequest['quoteStatus'];
  product?: { documentId?: string } | null;
  quantityTons?: number;
};

export function normalizeQuote(quote: RawQuote): QuoteRequest {
  const quoteStatus = quote.quoteStatus ?? quote.status ?? 'new';
  const quantity =
    quote.quantity != null
      ? Number(quote.quantity)
      : quote.quantityTons != null
        ? Number(quote.quantityTons)
        : 0;

  return {
    ...quote,
    productDocumentId: quote.productDocumentId ?? quote.product?.documentId,
    quantity,
    quantityUnit: quote.quantityUnit ?? 'Metric Ton',
    quantityTons: quote.quantityTons != null ? Number(quote.quantityTons) : undefined,
    quotedPrice: quote.quotedPrice != null ? Number(quote.quotedPrice) : undefined,
    quoteStatus,
  };
}
