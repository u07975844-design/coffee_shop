import { AppError } from '../utils/errors.js';

export const ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Preparing',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export const CANCELLABLE_BY_CUSTOMER_STATUSES = ['Pending', 'Confirmed'];

export function validateCreateOrderInput(body) {
  const customerName = String(body?.customer_name || '').trim();
  const customerPhone = String(body?.customer_phone || '').trim();
  const fulfillmentType = body?.fulfillment_type;
  const deliveryAddress = body?.delivery_address ? String(body.delivery_address).trim() : null;
  const orderNotes = body?.order_notes ? String(body.order_notes).trim() : null;
  const paymentMethod = body?.payment_method;
  const couponCode = body?.coupon_code ? String(body.coupon_code).trim().toUpperCase() : null;
  const items = Array.isArray(body?.items) ? body.items : [];

  if (customerName.length < 2 || customerName.length > 120) {
    throw new AppError('Customer name is required (2–120 characters).', 400, 'VALIDATION_ERROR');
  }
  if (customerPhone.length < 7 || customerPhone.length > 40) {
    throw new AppError('A valid phone number is required.', 400, 'VALIDATION_ERROR');
  }
  if (!['pickup', 'delivery'].includes(fulfillmentType)) {
    throw new AppError('Fulfillment type must be pickup or delivery.', 400, 'VALIDATION_ERROR');
  }
  if (fulfillmentType === 'delivery' && (!deliveryAddress || deliveryAddress.length < 8)) {
    throw new AppError('A complete delivery address is required for delivery orders.', 400, 'VALIDATION_ERROR');
  }
  if (!['cash_on_delivery', 'pay_at_pickup'].includes(paymentMethod)) {
    throw new AppError('Invalid payment method selected.', 400, 'VALIDATION_ERROR');
  }
  if (fulfillmentType === 'delivery' && paymentMethod !== 'cash_on_delivery') {
    throw new AppError('Delivery orders must use Cash on Delivery.', 400, 'VALIDATION_ERROR');
  }
  if (fulfillmentType === 'pickup' && paymentMethod !== 'pay_at_pickup') {
    throw new AppError('Pickup orders must use Pay at Pickup.', 400, 'VALIDATION_ERROR');
  }
  if (items.length === 0) {
    throw new AppError('Your shopping cart is empty.', 400, 'VALIDATION_ERROR');
  }

  const normalizedItems = items.map((item, idx) => {
    const productId = Number(item?.product_id);
    const quantity = Number(item?.quantity);
    const optionIds = Array.isArray(item?.option_ids)
      ? [...new Set(item.option_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0))]
      : [];

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new AppError(`Item #${idx + 1} has an invalid product ID.`, 400, 'VALIDATION_ERROR');
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      throw new AppError(`Item #${idx + 1} quantity must be between 1 and 50.`, 400, 'VALIDATION_ERROR');
    }

    return { product_id: productId, quantity, option_ids: optionIds };
  });

  return {
    customer_name: customerName,
    customer_phone: customerPhone,
    fulfillment_type: fulfillmentType,
    delivery_address: fulfillmentType === 'delivery' ? deliveryAddress : null,
    order_notes: orderNotes ? orderNotes.slice(0, 600) : null,
    payment_method: paymentMethod,
    coupon_code: couponCode,
    items: normalizedItems,
  };
}

export function validateReviewInput(body) {
  const orderItemId = Number(body?.order_item_id);
  const rating = Number(body?.rating);
  const comment = String(body?.comment || '').trim();

  if (!Number.isInteger(orderItemId) || orderItemId <= 0) {
    throw new AppError('Valid order item reference is required.', 400, 'VALIDATION_ERROR');
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError('Rating must be a whole number from 1 to 5.', 400, 'VALIDATION_ERROR');
  }
  if (comment.length < 5 || comment.length > 1200) {
    throw new AppError('Review comment must be between 5 and 1,200 characters.', 400, 'VALIDATION_ERROR');
  }

  return { order_item_id: orderItemId, rating, comment };
}
