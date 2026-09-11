import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
// If VITE_API_BASE_URL is defined (e.g. https://ecommerce-saas-api.onrender.com), route through it; otherwise default to local /api proxy
const resolvedBaseUrl = rawBaseUrl
  ? `${rawBaseUrl.replace(/\/+$/, '')}/api`
  : '/api';

export const axiosClient = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Token
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('saas_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 Handler for Genuine Merchant Session Expiration
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';

    // Ignore 401/403 rejections on third-party test endpoints or external Meta responses
    const isThirdPartyTest = requestUrl.includes('/settings/whatsapp') || requestUrl.includes('/test');
    const isMetaApiError = error.response?.data?.error === 'MetaApiError' || error.response?.data?.error === 'WhatsAppApiError';

    if (isThirdPartyTest || isMetaApiError) {
      // Let the component catch and display the error directly without logging out
      return Promise.reject(error);
    }

    // Only clear credentials and redirect if the merchant's SaaS JWT session is genuinely rejected
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      localStorage.removeItem('saas_auth_token');
      localStorage.removeItem('saas_user_data');
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
