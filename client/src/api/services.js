import api from './axiosClient.js';

export const AuthAPI = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login: (data) => api.post('/auth/login', data).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (data) => api.put('/auth/profile', data).then((r) => r.data),
};

export const PublicAPI = {
  getSettings: () => api.get('/public/settings').then((r) => r.data),
  getOffers: () => api.get('/public/offers').then((r) => r.data),
  validateOffer: (coupon_code, subtotal) =>
    api.post('/public/offers/validate', { coupon_code, subtotal }).then((r) => r.data),
  getCategories: () => api.get('/public/categories').then((r) => r.data),
  getProducts: (params) => api.get('/public/products', { params }).then((r) => r.data),
  getProductDetails: (idOrSlug) => api.get(`/public/products/${idOrSlug}`).then((r) => r.data),
  getReviews: (limit = 24) => api.get('/public/reviews', { params: { limit } }).then((r) => r.data),
  submitContact: (data) => api.post('/public/contact', data).then((r) => r.data),
};

export const OrderAPI = {
  placeOrder: (data) => api.post('/orders', data).then((r) => r.data),
  getMyOrders: (page = 1) => api.get('/orders', { params: { page } }).then((r) => r.data),
  getMyOrderDetails: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  cancelMyOrder: (id, reason) => api.patch(`/orders/${id}/cancel`, { reason }).then((r) => r.data),
  submitReview: (data) => api.post('/orders/reviews', data).then((r) => r.data),
};

export const AdminAPI = {
  getDashboard: (days = 7) => api.get('/admin/dashboard', { params: { days } }).then((r) => r.data),

  listCategories: (archived = false) =>
    api.get('/admin/categories', { params: { archived } }).then((r) => r.data),
  createCategory: (data) => api.post('/admin/categories', data).then((r) => r.data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data).then((r) => r.data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`).then((r) => r.data),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api
      .post('/admin/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
  listProducts: (params) => api.get('/admin/products', { params }).then((r) => r.data),
  createProduct: (data) => api.post('/admin/products', data).then((r) => r.data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data).then((r) => r.data),
  archiveProduct: (id, is_archived) =>
    api.patch(`/admin/products/${id}/archive`, { is_archived }).then((r) => r.data),

  listInventory: (filter = 'all') =>
    api.get('/admin/inventory', { params: { filter } }).then((r) => r.data),
  adjustInventory: (data) => api.post('/admin/inventory/adjust', data).then((r) => r.data),
  listInventoryMovements: (params) =>
    api.get('/admin/inventory/movements', { params }).then((r) => r.data),

  listOrders: (params) => api.get('/admin/orders', { params }).then((r) => r.data),
  getOrderDetails: (id) => api.get(`/admin/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id, status, note) =>
    api.patch(`/admin/orders/${id}/status`, { status, note }).then((r) => r.data),

  listUsers: () => api.get('/admin/users').then((r) => r.data),
  updateUserAccess: (id, data) => api.patch(`/admin/users/${id}`, data).then((r) => r.data),

  listReviews: (status = 'all') =>
    api.get('/admin/reviews', { params: { status } }).then((r) => r.data),
  updateReviewStatus: (id, status) =>
    api.patch(`/admin/reviews/${id}/status`, { status }).then((r) => r.data),
  deleteReview: (id) => api.delete(`/admin/reviews/${id}`).then((r) => r.data),

  listOffers: () => api.get('/admin/offers').then((r) => r.data),
  createOffer: (data) => api.post('/admin/offers', data).then((r) => r.data),
  updateOffer: (id, data) => api.put(`/admin/offers/${id}`, data).then((r) => r.data),
  deleteOffer: (id) => api.delete(`/admin/offers/${id}`).then((r) => r.data),

  updateSettings: (data) => api.put('/admin/settings', data).then((r) => r.data),
};
