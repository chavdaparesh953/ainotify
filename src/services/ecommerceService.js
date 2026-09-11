import prisma from '../db/prisma.js';

/**
 * Clean domain helper (removes protocol and trailing slashes)
 */
function cleanDomain(url) {
  if (!url) return '';
  return url.replace(/^https?:\/\//i, '').replace(/\/+$/, '').trim();
}

/**
 * Update Shopify Order:
 * Appends 'COD-Confirmed' or 'COD-Cancelled' tags and adds an audit order note.
 *
 * @param {Object} store - Store model instance from Prisma
 * @param {string|number} orderId - Shopify Order ID
 * @param {'CONFIRMED'|'CANCELLED'} action - Customer verification action
 * @returns {Promise<{success: boolean, platform: string, [key: string]: any}>}
 */
export async function updateShopifyOrder(store, orderId, action) {
  const isConfirm = String(action).toUpperCase() === 'CONFIRMED';
  const targetTag = isConfirm ? 'COD-Confirmed' : 'COD-Cancelled';
  const oppositeTag = isConfirm ? 'COD-Cancelled' : 'COD-Confirmed';
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
  const noteAudit = isConfirm
    ? `[WaNotify] Cash on Delivery verified via WhatsApp at ${timestamp} UTC`
    : `[WaNotify] Cash on Delivery cancelled via WhatsApp at ${timestamp} UTC`;

  const domain = cleanDomain(store?.storeUrl);
  const token = store?.accessToken || '';
  const numericId = String(orderId).replace(/\D/g, '') || String(orderId);

  // Check if store uses mock / test credentials or sandbox simulation
  const isMockStore =
    !token ||
    token.startsWith('shpat_mock_') ||
    token.startsWith('shpat_test_') ||
    token.startsWith('mock_') ||
    domain.includes('dummy') ||
    domain.includes('example.com') ||
    process.env.MOCK_ECOMMERCE === 'true';

  if (isMockStore) {
    console.log(
      `[EcommerceService] ⚡ Simulated Shopify write-back for Order #${numericId} on ${domain} -> Tag: "${targetTag}", Note: "${noteAudit}"`
    );
    return {
      success: true,
      simulated: true,
      platform: 'SHOPIFY',
      orderId: numericId,
      action: isConfirm ? 'CONFIRMED' : 'CANCELLED',
      tag: targetTag,
      note: noteAudit,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    // 1. Fetch existing order tags and note to append without overwriting
    let existingTags = '';
    let existingNote = '';

    try {
      const getRes = await fetch(`https://${domain}/admin/api/2024-01/orders/${numericId}.json?fields=id,tags,note`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
      });

      if (getRes.ok) {
        const orderData = await getRes.json();
        existingTags = orderData.order?.tags || '';
        existingNote = orderData.order?.note || '';
      }
    } catch (fetchErr) {
      console.warn(`[EcommerceService] Could not retrieve existing Shopify order #${numericId} details:`, fetchErr.message);
    }

    // Parse and update tags (deduplicate and remove opposite status tag)
    const tagArray = existingTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((t) => t !== oppositeTag && t !== targetTag);

    tagArray.push(targetTag);
    const combinedTags = tagArray.join(', ');
    const combinedNote = existingNote ? `${existingNote}\n${noteAudit}` : noteAudit;

    // 2. Push updated tags and note to Shopify Order
    const putRes = await fetch(`https://${domain}/admin/api/2024-01/orders/${numericId}.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order: {
          id: numericId,
          tags: combinedTags,
          note: combinedNote,
        },
      }),
    });

    if (!putRes.ok) {
      const errorText = await putRes.text();
      console.error(`[EcommerceService] Shopify API error (${putRes.status}):`, errorText);
      return {
        success: false,
        platform: 'SHOPIFY',
        orderId: numericId,
        status: putRes.status,
        error: errorText,
      };
    }

    const resData = await putRes.json();
    console.log(`[EcommerceService] ✅ Shopify Order #${numericId} successfully updated with tag "${targetTag}"`);

    return {
      success: true,
      platform: 'SHOPIFY',
      orderId: numericId,
      tag: targetTag,
      note: noteAudit,
      order: resData.order,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[EcommerceService] Error updating Shopify order #${numericId}:`, err);
    return {
      success: false,
      platform: 'SHOPIFY',
      orderId: numericId,
      error: err.message || 'Unknown network error',
    };
  }
}

/**
 * Update WooCommerce Order:
 * Changes order status to 'processing' (on confirm) or 'cancelled' (on cancel),
 * and creates an internal audit note.
 *
 * @param {Object} store - Store model instance from Prisma
 * @param {string|number} orderId - WooCommerce Order ID
 * @param {'CONFIRMED'|'CANCELLED'} action - Customer verification action
 * @returns {Promise<{success: boolean, platform: string, [key: string]: any}>}
 */
export async function updateWooCommerceOrder(store, orderId, action) {
  const isConfirm = String(action).toUpperCase() === 'CONFIRMED';
  const targetStatus = isConfirm ? 'processing' : 'cancelled';
  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
  const noteAudit = isConfirm
    ? `[WaNotify] Cash on Delivery verified via WhatsApp at ${timestamp} UTC`
    : `[WaNotify] Cash on Delivery cancelled via WhatsApp at ${timestamp} UTC`;

  const domain = cleanDomain(store?.storeUrl);
  const token = store?.accessToken || '';
  const numericId = String(orderId).replace(/\D/g, '') || String(orderId);

  // Check if store uses mock / test credentials or sandbox simulation
  const isMockStore =
    !token ||
    token.startsWith('mock_') ||
    token.startsWith('test_') ||
    token.startsWith('wc_mock_') ||
    domain.includes('dummy') ||
    domain.includes('example.com') ||
    process.env.MOCK_ECOMMERCE === 'true';

  if (isMockStore) {
    console.log(
      `[EcommerceService] ⚡ Simulated WooCommerce write-back for Order #${numericId} on ${domain} -> Status: "${targetStatus}", Note: "${noteAudit}"`
    );
    return {
      success: true,
      simulated: true,
      platform: 'WOOCOMMERCE',
      orderId: numericId,
      action: isConfirm ? 'CONFIRMED' : 'CANCELLED',
      status: targetStatus,
      note: noteAudit,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const authHeaders = token.includes(':')
      ? { Authorization: `Basic ${Buffer.from(token).toString('base64')}` }
      : { Authorization: `Bearer ${token}` };

    // 1. Update Order Status
    const putRes = await fetch(`https://${domain}/wp-json/wc/v3/orders/${numericId}`, {
      method: 'PUT',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: targetStatus }),
    });

    if (!putRes.ok) {
      const errorText = await putRes.text();
      console.error(`[EcommerceService] WooCommerce API error (${putRes.status}):`, errorText);
      return {
        success: false,
        platform: 'WOOCOMMERCE',
        orderId: numericId,
        status: putRes.status,
        error: errorText,
      };
    }

    // 2. Add an internal audit note to the WooCommerce order
    try {
      await fetch(`https://${domain}/wp-json/wc/v3/orders/${numericId}/notes`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: noteAudit,
          customer_note: false,
        }),
      });
    } catch (noteErr) {
      console.warn(`[EcommerceService] Could not append WooCommerce order note:`, noteErr.message);
    }

    console.log(`[EcommerceService] ✅ WooCommerce Order #${numericId} successfully updated to "${targetStatus}"`);

    return {
      success: true,
      platform: 'WOOCOMMERCE',
      orderId: numericId,
      status: targetStatus,
      note: noteAudit,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error(`[EcommerceService] Error updating WooCommerce order #${numericId}:`, err);
    return {
      success: false,
      platform: 'WOOCOMMERCE',
      orderId: numericId,
      error: err.message || 'Unknown network error',
    };
  }
}

/**
 * Unified Dispatcher:
 * Synchronizes COD verification action back to merchant store (Shopify or WooCommerce)
 * and updates syncStatus (SYNCED or FAILED) in the PostgreSQL OrderVerification record.
 *
 * @param {Object|string} verificationOrId - OrderVerification record or its ID
 * @param {'CONFIRMED'|'CANCELLED'} action - Customer verification action
 * @returns {Promise<{success: boolean, syncStatus: 'SYNCED'|'FAILED', [key: string]: any}>}
 */
export async function syncOrderToStore(verificationOrId, action) {
  let verification = verificationOrId;

  // If passed as an ID or missing the store relation, load from database
  if (typeof verificationOrId === 'string' || !verification?.store) {
    const id = typeof verificationOrId === 'string' ? verificationOrId : verificationOrId.id;
    verification = await prisma.orderVerification.findUnique({
      where: { id },
      include: { store: true },
    });
  }

  if (!verification) {
    console.error('[EcommerceService] ❌ syncOrderToStore failed: OrderVerification not found');
    return { success: false, syncStatus: 'FAILED', error: 'OrderVerification not found' };
  }

  const store = verification.store;
  if (!store) {
    console.error(`[EcommerceService] ❌ syncOrderToStore failed: Store not found for verification ${verification.id}`);
    await prisma.orderVerification.update({
      where: { id: verification.id },
      data: { syncStatus: 'FAILED' },
    });
    return { success: false, syncStatus: 'FAILED', error: 'Store not found' };
  }

  const orderId = verification.orderId;
  let syncResult;

  if (store.platform === 'SHOPIFY') {
    syncResult = await updateShopifyOrder(store, orderId, action);
  } else if (store.platform === 'WOOCOMMERCE') {
    syncResult = await updateWooCommerceOrder(store, orderId, action);
  } else {
    syncResult = { success: false, error: `Unsupported store platform: ${store.platform}` };
  }

  const newSyncStatus = syncResult.success ? 'SYNCED' : 'FAILED';

  // Merge sync audit data into OrderVerification metadata
  const existingMetadata =
    typeof verification.metadata === 'object' && verification.metadata !== null ? verification.metadata : {};

  const updatedMetadata = {
    ...existingMetadata,
    storeSync: {
      platform: store.platform,
      action,
      syncStatus: newSyncStatus,
      syncedAt: new Date().toISOString(),
      ...(syncResult.simulated ? { simulated: true } : {}),
      ...(syncResult.error ? { error: syncResult.error } : {}),
      ...(syncResult.tag ? { tag: syncResult.tag } : {}),
      ...(syncResult.status ? { status: syncResult.status } : {}),
    },
  };

  await prisma.orderVerification.update({
    where: { id: verification.id },
    data: {
      syncStatus: newSyncStatus,
      metadata: updatedMetadata,
    },
  });

  console.log(
    `[EcommerceService] OrderVerification ${verification.id} syncStatus set to "${newSyncStatus}" (${store.platform})`
  );

  return {
    ...syncResult,
    syncStatus: newSyncStatus,
  };
}

export default {
  updateShopifyOrder,
  updateWooCommerceOrder,
  syncOrderToStore,
};
