import { AppError } from '../utils/errors.js';

export function validateCategoryInput(body) {
  const name = String(body?.name || '').trim();
  const description = body?.description ? String(body.description).trim() : null;
  const imageUrl = body?.image_url ? String(body.image_url).trim() : null;
  const sortOrder = Number.isFinite(Number(body?.sort_order)) ? Number(body.sort_order) : 0;
  const isActive = body?.is_active === undefined ? true : Boolean(body.is_active);

  if (name.length < 2 || name.length > 120) {
    throw new AppError('Category name must be between 2 and 120 characters.', 400, 'VALIDATION_ERROR');
  }

  return { name, description, image_url: imageUrl, sort_order: sortOrder, is_active: isActive ? 1 : 0 };
}

export function validateProductInput(body, isCreate = true) {
  const categoryId = Number(body?.category_id);
  const name = String(body?.name || '').trim();
  const description = String(body?.description || '').trim();
  const tastingNotes = body?.tasting_notes ? String(body.tasting_notes).trim() : null;
  const origin = body?.origin ? String(body.origin).trim() : null;
  const imageUrl = body?.image_url ? String(body.image_url).trim() : null;
  const basePrice = Number(body?.base_price);
  const stockQuantity = body?.stock_quantity !== undefined ? Number(body.stock_quantity) : 0;
  const lowStockThreshold = body?.low_stock_threshold !== undefined ? Number(body.low_stock_threshold) : 10;
  const isFeatured = Boolean(body?.is_featured);
  const isBestseller = Boolean(body?.is_bestseller);
  const isAvailable = body?.is_available === undefined ? true : Boolean(body.is_available);

  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    throw new AppError('Valid category_id is required.', 400, 'VALIDATION_ERROR');
  }
  if (name.length < 2 || name.length > 160) {
    throw new AppError('Product name must be between 2 and 160 characters.', 400, 'VALIDATION_ERROR');
  }
  if (description.length < 10) {
    throw new AppError('Product description must be at least 10 characters.', 400, 'VALIDATION_ERROR');
  }
  if (!Number.isFinite(basePrice) || basePrice <= 0) {
    throw new AppError('Base price must be greater than zero.', 400, 'VALIDATION_ERROR');
  }
  if (isCreate && (!Number.isInteger(stockQuantity) || stockQuantity < 0)) {
    throw new AppError('Initial stock quantity must be a non-negative integer.', 400, 'VALIDATION_ERROR');
  }
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
    throw new AppError('Low-stock threshold must be a non-negative integer.', 400, 'VALIDATION_ERROR');
  }

  const options = Array.isArray(body?.options)
    ? body.options.map((opt, index) => {
        const optionGroup = String(opt?.option_group || '').trim();
        const optionName = String(opt?.option_name || '').trim();
        const priceDelta = Number(opt?.price_delta || 0);
        const trackStock = Boolean(opt?.track_stock);
        const optStock = Number(opt?.stock_quantity || 0);
        const optThreshold = Number(opt?.low_stock_threshold ?? 5);

        if (!optionGroup || !optionName) {
          throw new AppError(`Option #${index + 1} requires both group and name.`, 400, 'VALIDATION_ERROR');
        }
        if (!Number.isFinite(priceDelta)) {
          throw new AppError(`Option "${optionName}" has an invalid price delta.`, 400, 'VALIDATION_ERROR');
        }
        if (trackStock && (!Number.isInteger(optStock) || optStock < 0)) {
          throw new AppError(`Option "${optionName}" stock must be a non-negative integer.`, 400, 'VALIDATION_ERROR');
        }

        return {
          id: opt?.id ? Number(opt.id) : null,
          option_group: optionGroup.slice(0, 60),
          option_name: optionName.slice(0, 80),
          price_delta: priceDelta,
          track_stock: trackStock ? 1 : 0,
          stock_quantity: trackStock ? optStock : 0,
          low_stock_threshold: trackStock ? Math.max(0, optThreshold) : 5,
          is_available: opt?.is_available === undefined ? 1 : opt.is_available ? 1 : 0,
          sort_order: index + 1,
        };
      })
    : undefined;

  return {
    category_id: categoryId,
    name,
    description,
    tasting_notes: tastingNotes,
    origin,
    image_url: imageUrl,
    base_price: basePrice,
    stock_quantity: stockQuantity,
    low_stock_threshold: lowStockThreshold,
    is_featured: isFeatured ? 1 : 0,
    is_bestseller: isBestseller ? 1 : 0,
    is_available: isAvailable ? 1 : 0,
    options,
  };
}

export function validateInventoryAdjustmentInput(body) {
  const productId = Number(body?.product_id);
  const optionId = body?.option_id ? Number(body.option_id) : null;
  const action = body?.action; // 'add' | 'reduce' | 'set'
  const quantity = Number(body?.quantity);
  const reason = String(body?.reason || '').trim();

  if (!Number.isInteger(productId) || productId <= 0) {
    throw new AppError('Valid product_id is required.', 400, 'VALIDATION_ERROR');
  }
  if (!['add', 'reduce', 'set'].includes(action)) {
    throw new AppError('Inventory action must be add, reduce, or set.', 400, 'VALIDATION_ERROR');
  }
  if (!Number.isInteger(quantity) || quantity < 0 || (action !== 'set' && quantity === 0)) {
    throw new AppError('Quantity must be a valid integer.', 400, 'VALIDATION_ERROR');
  }
  if (reason.length < 3 || reason.length > 255) {
    throw new AppError('Please enter a clear adjustment reason (3–255 characters).', 400, 'VALIDATION_ERROR');
  }

  return { product_id: productId, option_id: optionId, action, quantity, reason };
}

export function validateOfferInput(body) {
  const title = String(body?.title || '').trim();
  const description = String(body?.description || '').trim();
  const couponCode = body?.coupon_code ? String(body.coupon_code).trim().toUpperCase() : null;
  const discountType = body?.discount_type;
  const discountValue = Number(body?.discount_value);
  const minOrderAmount = Number(body?.min_order_amount || 0);
  const startsAt = body?.starts_at ? new Date(body.starts_at) : null;
  const expiresAt = body?.expires_at ? new Date(body.expires_at) : null;
  const isActive = body?.is_active === undefined ? 1 : body.is_active ? 1 : 0;

  if (title.length < 3 || title.length > 160) {
    throw new AppError('Offer title must be between 3 and 160 characters.', 400, 'VALIDATION_ERROR');
  }
  if (description.length < 5) {
    throw new AppError('Offer description must be at least 5 characters.', 400, 'VALIDATION_ERROR');
  }
  if (!['percentage', 'fixed'].includes(discountType)) {
    throw new AppError('Discount type must be percentage or fixed.', 400, 'VALIDATION_ERROR');
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw new AppError('Discount value must be greater than zero.', 400, 'VALIDATION_ERROR');
  }
  if (discountType === 'percentage' && discountValue > 90) {
    throw new AppError('Percentage discount cannot exceed 90%.', 400, 'VALIDATION_ERROR');
  }
  if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
    throw new AppError('Minimum order amount cannot be negative.', 400, 'VALIDATION_ERROR');
  }
  if (!startsAt || Number.isNaN(startsAt.getTime()) || !expiresAt || Number.isNaN(expiresAt.getTime())) {
    throw new AppError('Valid start and expiration dates are required.', 400, 'VALIDATION_ERROR');
  }
  if (expiresAt <= startsAt) {
    throw new AppError('Expiration date must be after the start date.', 400, 'VALIDATION_ERROR');
  }

  return {
    title,
    description,
    coupon_code: couponCode,
    discount_type: discountType,
    discount_value: discountValue,
    min_order_amount: minOrderAmount,
    starts_at: startsAt,
    expires_at: expiresAt,
    is_active: isActive,
  };
}
