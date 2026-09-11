import prisma from '../db/prisma.js';

/**
 * Helper to fetch all store IDs owned by the authenticated merchant
 * @param {string} userId
 * @returns {Promise<string[]>}
 */
async function getUserStoreIds(userId) {
  const stores = await prisma.store.findMany({
    where: { userId },
    select: { id: true },
  });
  return stores.map((s) => s.id);
}

/**
 * Get aggregated messaging metrics for authenticated merchant's dashboard
 * GET /api/dashboard/stats
 */
/**
 * Helper to generate 7-day initial buckets (from 6 days ago up to today)
 * @returns {Array<{ date: string, dayKey: string, whatsapp: number, sms: number, recovered: number, total: number }>}
 */
function generateLast7Days() {
  const days = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const dayKey = d.toISOString().split('T')[0];
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    days.push({
      date: dateLabel,
      dayKey,
      whatsapp: 0,
      sms: 0,
      recovered: 0,
      total: 0,
    });
  }
  return days;
}

/**
 * Get aggregated messaging metrics for authenticated merchant's dashboard
 * GET /api/dashboard/stats
 */
export async function getStats(req, res, next) {
  try {
    const userId = req.user.id;
    const storeIds = await getUserStoreIds(userId);
    const initialChartData = generateLast7Days();

    if (storeIds.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalMessages: 0,
          sent: 0,
          failed: 0,
          pending: 0,
          read: 0,
          smsFallback: 0,
          deliveryRate: '0.00%',
          totalStores: 0,
          recoveredCheckouts: 0,
          abandonedCartsSaved: 0,
          recoveredOrganically: 0,
          chartData: initialChartData.map(({ date, whatsapp, sms, recovered, total }) => ({
            date,
            whatsapp,
            sms,
            recovered,
            total,
          })),
        },
      });
    }

    // Group message counts by status
    const groupedCounts = await prisma.messageLog.groupBy({
      by: ['status'],
      where: {
        storeId: { in: storeIds },
      },
      _count: {
        status: true,
      },
    });

    // Tally status counts
    const counts = {
      SENT: 0,
      FAILED: 0,
      PENDING: 0,
      READ: 0,
      SMS_FALLBACK: 0,
    };

    let totalMessages = 0;

    for (const group of groupedCounts) {
      const status = group.status;
      const count = group._count.status;
      if (counts[status] !== undefined) {
        counts[status] = count;
      }
      totalMessages += count;
    }

    // Calculate delivery rate percentage: (SENT + READ + SMS_FALLBACK) / total
    const deliveredCount = counts.SENT + counts.READ + counts.SMS_FALLBACK;
    const deliveryRate =
      totalMessages > 0 ? `${((deliveredCount / totalMessages) * 100).toFixed(2)}%` : '0.00%';

    // Fetch abandoned checkout message logs to compute recovered carts metrics
    const abandonedCartLogs = await prisma.messageLog.findMany({
      where: {
        storeId: { in: storeIds },
        OR: [
          { metadata: { path: ['triggerEvent'], equals: 'ABANDONED_CHECKOUT' } },
          { metadata: { path: ['topic'], string_contains: 'checkout' } },
          { metadata: { path: ['topic'], string_contains: 'abandon' } },
        ],
      },
      select: {
        status: true,
        metadata: true,
      },
    });

    let recoveredCheckouts = 0;
    let recoveredOrganically = 0;

    for (const log of abandonedCartLogs) {
      if ((log.status === 'SENT' || log.status === 'SMS_FALLBACK') && !log.metadata?.skipped) {
        recoveredCheckouts++;
      } else if (log.metadata?.reason === 'RECOVERED_ORGANICALLY') {
        recoveredOrganically++;
      }
    }

    // 7-Day Time Series Aggregation for Recharts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const timeSeriesLogs = await prisma.messageLog.findMany({
      where: {
        storeId: { in: storeIds },
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        channel: true,
        status: true,
        metadata: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dayBuckets = new Map();
    for (const d of initialChartData) {
      dayBuckets.set(d.dayKey, { ...d });
    }

    for (const log of timeSeriesLogs) {
      const dayKey = new Date(log.createdAt).toISOString().split('T')[0];
      const bucket = dayBuckets.get(dayKey);
      if (bucket) {
        const isSms = log.channel === 'SMS' || log.status === 'SMS_FALLBACK';
        if (isSms) {
          bucket.sms++;
        } else {
          bucket.whatsapp++;
        }
        bucket.total++;

        const isAbandonedCheckout =
          log.metadata?.triggerEvent === 'ABANDONED_CHECKOUT' ||
          String(log.metadata?.topic || '').toLowerCase().includes('checkout') ||
          String(log.metadata?.topic || '').toLowerCase().includes('abandon');

        if (
          isAbandonedCheckout &&
          (log.status === 'SENT' || log.status === 'SMS_FALLBACK' || log.metadata?.reason === 'RECOVERED_ORGANICALLY')
        ) {
          bucket.recovered++;
        }
      }
    }

    const chartData = Array.from(dayBuckets.values()).map(({ date, whatsapp, sms, recovered, total }) => ({
      date,
      whatsapp,
      sms,
      recovered,
      total,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalMessages,
        sent: counts.SENT,
        failed: counts.FAILED,
        pending: counts.PENDING,
        read: counts.READ,
        smsFallback: counts.SMS_FALLBACK,
        deliveryRate,
        totalStores: storeIds.length,
        recoveredCheckouts,
        abandonedCartsSaved: recoveredCheckouts,
        recoveredOrganically,
        chartData,
      },
    });
  } catch (error) {
    console.error('[Dashboard getStats Error]', error);
    next(error);
  }
}

/**
 * Get recent message logs with pagination and optional filters
 * GET /api/dashboard/recent-logs
 *
 * Query parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 * - status: 'SENT' | 'FAILED' | 'PENDING' | 'READ'
 * - storeId: uuid (must belong to user)
 */
export async function getRecentLogs(req, res, next) {
  try {
    const userId = req.user.id;
    const userStoreIds = await getUserStoreIds(userId);

    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const skip = (page - 1) * limit;

    const { status, storeId } = req.query;

    if (userStoreIds.length === 0) {
      return res.status(200).json({
        success: true,
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
        logs: [],
      });
    }

    // Build filter criteria
    const where = {
      storeId: { in: userStoreIds },
    };

    if (storeId && typeof storeId === 'string') {
      // Validate storeId belongs to merchant
      if (!userStoreIds.includes(storeId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'Requested storeId does not belong to your merchant account.',
        });
      }
      where.storeId = storeId;
    }

    if (status && typeof status === 'string') {
      const normalizedStatus = status.trim().toUpperCase();
      const validStatuses = ['PENDING', 'SENT', 'FAILED', 'READ', 'SMS_FALLBACK'];
      if (validStatuses.includes(normalizedStatus)) {
        where.status = normalizedStatus;
      }
    }

    // Query logs and total count in parallel
    const [totalCount, logs] = await Promise.all([
      prisma.messageLog.count({ where }),
      prisma.messageLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          store: {
            select: {
              id: true,
              platform: true,
              storeUrl: true,
            },
          },
          orderVerification: {
            select: {
              id: true,
              orderId: true,
              orderNumber: true,
              status: true,
              syncStatus: true,
              totalAmount: true,
              currency: true,
              confirmedAt: true,
              cancelledAt: true,
              customerName: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      success: true,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
      },
      logs,
    });
  } catch (error) {
    console.error('[Dashboard getRecentLogs Error]', error);
    next(error);
  }
}

/**
 * List all connected stores for authenticated merchant
 * GET /api/dashboard/stores
 *
 * Securely excludes accessToken and webhookSecret
 */
export async function getStores(req, res, next) {
  try {
    const userId = req.user.id;

    const rawStores = await prisma.store.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        platform: true,
        storeUrl: true,
        webhookSecret: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messageLogs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Sanitize: indicate presence of webhookSecret without exposing raw secret value
    const stores = rawStores.map((s) => ({
      id: s.id,
      userId: s.userId,
      platform: s.platform,
      storeUrl: s.storeUrl,
      hasWebhookSecret: Boolean(s.webhookSecret),
      totalMessages: s._count.messageLogs,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return res.status(200).json({
      success: true,
      total: stores.length,
      stores,
    });
  } catch (error) {
    console.error('[Dashboard getStores Error]', error);
    next(error);
  }
}

export default {
  getStats,
  getRecentLogs,
  getStores,
};
