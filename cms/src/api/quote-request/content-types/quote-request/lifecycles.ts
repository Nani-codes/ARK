import type { NotificationEvent } from '../../../../config/notification-templates';
import { formatInr, notifyUser } from '../../../../utils/notify-user';

type QuoteRecord = {
  productName?: string;
  quantity?: number | string;
  quantityUnit?: string;
  quotedPrice?: number | string;
  quoteStatus?: string;
  phone?: string;
  user?: { id?: number } | number;
};

function quoteStatusEvent(status?: string): NotificationEvent | null {
  switch (status) {
    case 'contacted':
      return 'quote_contacted';
    case 'quoted':
      return 'quote_quoted';
    case 'closed':
      return 'quote_closed';
    default:
      return null;
  }
}

function resolveUserId(quote: QuoteRecord): number | undefined {
  if (typeof quote.user === 'number') return quote.user;
  return quote.user?.id;
}

async function notifyQuoteReceived(quote: QuoteRecord) {
  if (!quote.productName) return;

  const qty = quote.quantity != null ? String(quote.quantity) : '';
  const unit = quote.quantityUnit ?? '';

  await notifyUser(strapi, {
    userId: resolveUserId(quote),
    phone: quote.phone,
    event: 'quote_received',
    variables: {
      '1': quote.productName,
      '2': `${qty} ${unit}`.trim(),
    },
  });
}

async function notifyQuoteStatusChange(quote: QuoteRecord) {
  if (!quote.productName || !quote.quoteStatus) return;

  const event = quoteStatusEvent(quote.quoteStatus);
  if (!event) return;

  const variables: Record<string, string> = { '1': quote.productName };
  if (event === 'quote_quoted' && quote.quotedPrice != null) {
    variables['2'] = formatInr(quote.quotedPrice);
  }

  await notifyUser(strapi, {
    userId: resolveUserId(quote),
    phone: quote.phone,
    event,
    variables,
  });
}

export default {
  async beforeCreate(event) {
    const { data } = event.params;
    const ctx = strapi.requestContext.get();

    if (ctx?.state?.user) {
      data.user = ctx.state.user.id;
      if (!data.phone && ctx.state.user.username?.startsWith('user_')) {
        data.phone = ctx.state.user.username.replace('user_', '');
      }
    }

    if (data.quantity == null && data.quantityTons != null) {
      data.quantity = data.quantityTons;
      if (!data.quantityUnit) data.quantityUnit = 'Metric Ton';
    }

    if (data.quantity != null && data.quantityTons == null) {
      const unit = String(data.quantityUnit ?? '').toLowerCase();
      if (unit.includes('ton')) {
        data.quantityTons = data.quantity;
      }
    }

    const productId = data.product?.id ?? data.product;
    if (productId && !data.productName) {
      const product = await strapi.db.query('api::product.product').findOne({
        where: { id: productId },
      });
      if (product?.name) data.productName = product.name;
    }
  },

  async afterCreate(event) {
    const { result } = event;
    if (result) {
      await notifyQuoteReceived(result as QuoteRecord);
    }
  },

  async afterUpdate(event) {
    const { result, params } = event;
    if (params?.data?.quoteStatus && result?.quoteStatus) {
      await notifyQuoteStatusChange(result as QuoteRecord);
    }
  },
};
