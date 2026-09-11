import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient.js';
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Phone,
  Store,
  Info,
  X,
} from 'lucide-react';

export function MessageLogsPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (page = 1, status = statusFilter) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (status) params.append('status', status);

      const res = await axiosClient.get(`/dashboard/recent-logs?${params.toString()}`);
      if (res.data?.logs) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch message logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1, statusFilter);
  }, [statusFilter]);

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    fetchLogs(1, newStatus);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Delivery Message Logs</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time audit trails of all WhatsApp and SMS dispatches across your storefronts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLogs(pagination.page, statusFilter)}
            disabled={isLoading}
            className="p-2.5 rounded-xl glass-card text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Status:</span>
        </span>

        {[
          { label: 'All Logs', value: '' },
          { label: 'Sent', value: 'SENT' },
          { label: 'Failed', value: 'FAILED' },
          { label: 'Pending', value: 'PENDING' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => handleStatusChange(f.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              statusFilter === f.value
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs Table Container */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3.5 px-6">Customer Phone</th>
                <th className="py-3.5 px-6">Delivery Status</th>
                <th className="py-3.5 px-6">COD Status</th>
                <th className="py-3.5 px-6">Platform / Store</th>
                <th className="py-3.5 px-6">Channel</th>
                <th className="py-3.5 px-6">Dispatched At</th>
                <th className="py-3.5 px-6 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                    <span>Loading message logs...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-400">No message logs found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Incoming e-commerce webhooks will display live delivery status here.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isSent = log.status === 'SENT';
                  const isFailed = log.status === 'FAILED';
                  const cod = log.orderVerification;

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                      {/* Customer Phone */}
                      <td className="py-4 px-6 font-mono text-white font-medium">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{log.customerPhone}</span>
                        </div>
                      </td>

                      {/* Delivery Status Badge */}
                      <td className="py-4 px-6">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>SENT</span>
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>FAILED</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>

                      {/* COD Status Badge & Sync Indicator */}
                      <td className="py-4 px-6">
                        {cod ? (
                          <div className="flex items-center gap-1.5">
                            {cod.status === 'CONFIRMED' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>CONFIRMED</span>
                              </span>
                            ) : cod.status === 'CANCELLED' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <XCircle className="w-3 h-3" />
                                <span>CANCELLED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Clock className="w-3 h-3" />
                                <span>COD PENDING</span>
                              </span>
                            )}

                            {/* Store Sync Icon Indicator */}
                            {cod.syncStatus === 'SYNCED' && (
                              <span title="Synced to Merchant Store">
                                <RefreshCw className="w-3 h-3 text-emerald-400 hover:rotate-180 transition-transform" />
                              </span>
                            )}
                            {cod.syncStatus === 'FAILED' && (
                              <span title="Store Write-back Failed">
                                <AlertCircle className="w-3 h-3 text-rose-400" />
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 font-mono text-xs">-</span>
                        )}
                      </td>

                      {/* Store / Platform */}
                      <td className="py-4 px-6 text-slate-300">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              log.store?.platform === 'SHOPIFY' ? 'bg-emerald-400' : 'bg-indigo-400'
                            }`}
                          />
                          <span className="truncate max-w-[180px]" title={log.store?.storeUrl}>
                            {log.store?.storeUrl || 'Unknown Store'}
                          </span>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-4 px-6">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-emerald-400 border border-slate-700">
                          {log.channel || 'WHATSAPP'}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp || log.createdAt).toLocaleString()}
                      </td>

                      {/* Details View */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="View metadata payload"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-white">{logs.length}</span> of{' '}
            <span className="font-semibold text-white">{pagination.total}</span> message logs
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1 || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-3 py-1 text-slate-300 font-medium">
              Page {pagination.page} of {pagination.totalPages || 1}
            </span>

            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || isLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg glass-panel bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Message Log Details</h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">ID: {selectedLog.id}</p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient Phone:</span>
                  <span className="font-mono text-white font-semibold">{selectedLog.customerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Delivery Status:</span>
                  <span className="font-semibold text-emerald-400">{selectedLog.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Store Domain:</span>
                  <span className="text-white">{selectedLog.store?.storeUrl}</span>
                </div>
              </div>

              {/* COD Verification Card if present */}
              {selectedLog.orderVerification && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      COD Order Verification
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Store Sync Status Badge */}
                      {selectedLog.orderVerification.syncStatus === 'SYNCED' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          title="Tags and notes pushed to merchant store"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Store Synced</span>
                        </span>
                      ) : selectedLog.orderVerification.syncStatus === 'FAILED' ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          title="Store write-back failed"
                        >
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>Sync Failed</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20"
                          title="Store write-back pending"
                        >
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          <span>Sync Pending</span>
                        </span>
                      )}

                      {/* COD Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selectedLog.orderVerification.status === 'CONFIRMED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : selectedLog.orderVerification.status === 'CANCELLED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {selectedLog.orderVerification.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Order Ref</span>
                      <span className="font-semibold font-mono text-white">{selectedLog.orderVerification.orderNumber || selectedLog.orderVerification.orderId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Total Amount</span>
                      <span className="font-semibold text-white">{selectedLog.orderVerification.totalAmount || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Store Write-back</span>
                      <span className="font-semibold text-white flex items-center gap-1">
                        {selectedLog.orderVerification.syncStatus === 'SYNCED' ? (
                          <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                            <CheckCircle2 className="w-3 h-3" />
                            {selectedLog.store?.platform === 'SHOPIFY' ? 'Shopify Tags & Note Added' : 'WooCommerce Status Updated'}
                          </span>
                        ) : selectedLog.orderVerification.syncStatus === 'FAILED' ? (
                          <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                            <AlertCircle className="w-3 h-3" />
                            Sync Failed
                          </span>
                        ) : (
                          <span className="text-amber-300 flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3" />
                            Pending Sync
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Store Platform</span>
                      <span className="font-semibold text-white text-[11px]">
                        {selectedLog.store?.platform || 'E-Commerce Store'}
                      </span>
                    </div>
                    {selectedLog.orderVerification.confirmedAt && (
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px]">Confirmed At</span>
                        <span className="text-emerald-400">{new Date(selectedLog.orderVerification.confirmedAt).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedLog.orderVerification.cancelledAt && (
                      <div className="col-span-2">
                        <span className="text-slate-500 block text-[10px]">Cancelled At</span>
                        <span className="text-rose-400">{new Date(selectedLog.orderVerification.cancelledAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="font-semibold text-slate-300 mb-1.5">Payload & Audit Metadata</p>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-56">
                  {JSON.stringify(selectedLog.metadata || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageLogsPage;
