import api from './api';

/**
 * Service for fetching articles, categories, and gazette notices.
 */
export const articleService = {
  /**
   * Fetch published articles with optional filters.
   * @param {Object} [params]
   * @param {string} [params.status='published']
   * @param {string} [params.category]
   * @param {string} [params.department]
   * @param {number} [params.page=1]
   * @param {number} [params.limit=10]
   * @param {string} [params.search]
   * @returns {Promise<{success: boolean, data: Array, pagination: Object}>}
   */
  async getArticles(params = {}) {
    const query = {
      status: 'published',
      ...params,
    };
    return api.get('/articles', { params: query });
  },

  /**
   * Fetch a single article by unique slug.
   * @param {string} slug
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async getArticleBySlug(slug) {
    return api.get(`/articles/slug/${encodeURIComponent(slug)}`);
  },

  /**
   * Fetch all active categories.
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getCategories() {
    return api.get('/categories');
  },

  /**
   * Fetch top featured and breaking stories for the front page.
   * @param {number} [limit=10]
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getFeaturedStories(limit = 10) {
    return api.get('/articles', {
      params: {
        status: 'published',
        limit,
      },
    });
  },

  /**
   * Fetch latest official circulars.
   * @param {number} [limit=5]
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getCirculars(limit = 5) {
    return api.get('/circulars', {
      params: {
        limit,
      },
    });
  },

  /**
   * Fetch approved reader comments for an article.
   * @param {number|string} articleId
   * @returns {Promise<{success: boolean, data: Array, count: number}>}
   */
  async getArticleComments(articleId) {
    return api.get(`/articles/${encodeURIComponent(articleId)}/comments`);
  },

  /**
   * Submit a reader comment for moderation.
   * @param {number|string} articleId
   * @param {Object} data
   * @param {string} data.author_name
   * @param {string} data.author_email
   * @param {string} data.content
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async submitArticleComment(articleId, data) {
    return api.post(`/articles/${encodeURIComponent(articleId)}/comments`, {
      article_id: articleId,
      ...data,
    });
  },

  /**
   * Search across articles, circulars, and departments.
   * @param {string} q
   * @param {Object} [params]
   * @returns {Promise<{success: boolean, query: string, totalMatches: number, results: Object}>}
   */
  async search(q, params = {}) {
    return api.get('/search', {
      params: {
        q,
        ...params,
      },
    });
  },

  /**
   * Fetch all academic and administrative departments.
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  async getDepartments() {
    return api.get('/departments');
  },

  /**
   * Fetch detailed list of circulars with search and filter parameters.
   * @param {Object} [params]
   * @returns {Promise<{success: boolean, data: Array, count: number}>}
   */
  async getCircularsList(params = {}) {
    return api.get('/circulars', { params });
  },

  /**
   * Fetch campus gallery images with optional filters.
   * @param {Object} [params]
   * @param {string} [params.event_name]
   * @param {boolean} [params.is_featured_carousel]
   * @param {number} [params.department_id]
   * @param {number} [params.limit=24]
   * @param {number} [params.page=1]
   * @returns {Promise<{success: boolean, data: Array, pagination: Object}>}
   */
  async getGalleries(params = {}) {
    return api.get('/gallery', { params });
  },

  /**
   * Submit editorial tip, general inquiry, or grievance message.
   * @param {Object} data
   * @param {string} data.name
   * @param {string} data.email
   * @param {string} data.subject
   * @param {string} data.category
   * @param {string} data.message
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async submitContact(data) {
    return api.post('/contact', data);
  },

  /**
   * Subscribe an email to the Morning Quadrangle Digest newsletter.
   * @param {string} email
   * @param {string} [name]
   * @param {string} [frequency='weekly']
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async subscribeNewsletter(email, name = null, frequency = 'weekly') {
    return api.post('/subscribers', { email, name, frequency });
  },

  /**
   * Unsubscribe from the newsletter via unique verification token.
   * @param {string} token
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async unsubscribeNewsletter(token) {
    return api.get(`/subscribers/unsubscribe/${encodeURIComponent(token)}`);
  },

  /**
   * Fetch comprehensive dashboard overview analytics.
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async getAnalytics() {
    return api.get('/analytics');
  },

  /**
   * Create a new article dispatch.
   * @param {Object} data
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async createArticle(data) {
    return api.post('/articles', data);
  },

  /**
   * Update an existing article dispatch.
   * @param {number|string} id
   * @param {Object} data
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async updateArticle(id, data) {
    return api.put(`/articles/${encodeURIComponent(id)}`, data);
  },

  /**
   * Delete an article dispatch.
   * @param {number|string} id
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteArticle(id) {
    return api.delete(`/articles/${encodeURIComponent(id)}`);
  },

  /**
   * Create an official gazette circular.
   * @param {Object} data
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async createCircular(data) {
    return api.post('/circulars', data);
  },

  /**
   * Update an official gazette circular.
   * @param {number|string} id
   * @param {Object} data
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async updateCircular(id, data) {
    return api.put(`/circulars/${encodeURIComponent(id)}`, data);
  },

  /**
   * Delete an official gazette circular.
   * @param {number|string} id
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteCircular(id) {
    return api.delete(`/circulars/${encodeURIComponent(id)}`);
  },

  /**
   * Create a new pictorial gallery asset.
   * @param {Object} data
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async createGalleryItem(data) {
    return api.post('/gallery', data);
  },

  /**
   * Update an existing pictorial gallery asset.
   * @param {number|string} id
   * @param {Object} data
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async updateGalleryItem(id, data) {
    return api.put(`/gallery/${encodeURIComponent(id)}`, data);
  },

  /**
   * Delete a pictorial gallery asset.
   * @param {number|string} id
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteGalleryItem(id) {
    return api.delete(`/gallery/${encodeURIComponent(id)}`);
  },

  /**
   * Fetch reader inquiries and tips.
   * @param {Object} [params]
   * @returns {Promise<{success: boolean, data: Array, count: number}>}
   */
  async getInquiries(params = {}) {
    return api.get('/contact', { params });
  },

  /**
   * Update inquiry status and admin notes.
   * @param {number|string} id
   * @param {Object} data
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async updateInquiry(id, data) {
    return api.patch(`/contact/${encodeURIComponent(id)}`, data);
  },

  /**
   * Delete reader inquiry message.
   * @param {number|string} id
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteInquiry(id) {
    return api.delete(`/contact/${encodeURIComponent(id)}`);
  },

  /**
   * Fetch audit trail logs (Super Admin).
   * @param {Object} [params]
   * @returns {Promise<{success: boolean, data: Array, pagination: Object}>}
   */
  async getAuditLogs(params = {}) {
    return api.get('/audit', { params });
  },

  /**
   * Fetch all comments across all articles for editorial moderation.
   * @param {Object} [params]
   * @returns {Promise<{success: boolean, data: Array, pagination: Object}>}
   */
  async getAllComments(params = {}) {
    return api.get('/comments', { params });
  },

  /**
   * Update comment status (approved, pending, rejected).
   * @param {number|string} id
   * @param {string} status
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async updateCommentStatus(id, status) {
    return api.patch(`/comments/${encodeURIComponent(id)}`, { status });
  },

  /**
   * Delete reader comment by ID.
   * @param {number|string} id
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteComment(id) {
    return api.delete(`/comments/${encodeURIComponent(id)}`);
  },

  /**
   * Fetch system settings dictionary.
   * @returns {Promise<{success: boolean, settings: Object, data?: Object}>}
   */
  async getSettings() {
    return api.get('/settings');
  },

  /**
   * Update system settings dictionary (Super Admin).
   * @param {Object} data
   * @returns {Promise<{success: boolean, message: string, updated?: Object}>}
   */
  async updateSettings(data) {
    return api.put('/settings', data);
  },

  /**
   * Export complete database snapshot as JSON.
   */
  async exportJsonBackup() {
    const token = localStorage.getItem('mcc_token');
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';
    const response = await fetch(`${baseUrl}/backup/export/json`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`JSON snapshot export failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mcc-chronicles-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  /**
   * Export articles as RFC 4180 CSV.
   */
  async exportArticlesCsv() {
    const token = localStorage.getItem('mcc_token');
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:5000/api';
    const response = await fetch(`${baseUrl}/backup/export/articles/csv`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Articles CSV export failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mcc-chronicles-articles-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  /**
   * Upload an image to the media store (Task 88).
   * @param {File} file
   * @returns {Promise<{success: boolean, url: string, filename: string, data?: Object}>}
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Fetch active campus opinion poll (Task 85).
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async getActivePoll() {
    return api.get('/polls/active');
  },

  /**
   * Cast a vote in a campus poll (Task 85).
   * @param {number|string} pollId
   * @param {number} optionIndex
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async castPollVote(pollId, optionIndex) {
    return api.post(`/polls/${encodeURIComponent(pollId)}/vote`, { optionIndex });
  },

  /**
   * Fetch all tags with article counts (Task 86).
   * @returns {Promise<{success: boolean, count: number, data: Array}>}
   */
  async getTags() {
    return api.get('/tags');
  },

  /**
   * Fetch revision history for an article (Task 87).
   * @param {number|string} articleId
   * @returns {Promise<{success: boolean, count: number, data: Array}>}
   */
  async getArticleRevisions(articleId) {
    return api.get(`/articles/${encodeURIComponent(articleId)}/revisions`);
  },

  /**
   * Update authenticated user profile (Task 89).
   * @param {Object} data - { name, bio, avatar_url }
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async updateProfile(data) {
    return api.put('/users/profile', data);
  },

  /**
   * Change authenticated user password (Task 89).
   * @param {Object} data - { currentPassword, newPassword }
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async changePassword(data) {
    return api.put('/users/change-password', data);
  },

  /**
   * Fetch users list (Super Admin, Task 90).
   * @param {Object} [params]
   * @returns {Promise<{success: boolean, count: number, data: Array}>}
   */
  async getUsers(params = {}) {
    return api.get('/users', { params });
  },

  /**
   * Create staff user (Super Admin, Task 90).
   * @param {Object} data
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async createUser(data) {
    return api.post('/users', data);
  },

  /**
   * Update user details or role (Super Admin, Task 90).
   * @param {number|string} id
   * @param {Object} data
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async updateUser(id, data) {
    return api.put(`/users/${encodeURIComponent(id)}`, data);
  },

  /**
   * Delete staff user (Super Admin, Task 90).
   * @param {number|string} id
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deleteUser(id) {
    return api.delete(`/users/${encodeURIComponent(id)}`);
  },

  /**
   * Toggle user activation status (Super Admin, Task 90).
   * @param {number|string} id
   * @param {boolean} [isActive]
   * @returns {Promise<{success: boolean, message: string, is_active: number}>}
   */
  async toggleUserStatus(id, isActive) {
    return api.patch(`/users/${encodeURIComponent(id)}/status`, { is_active: isActive });
  },

  /**
   * Quick status transition on an article (Tasks 94 & 96).
   * @param {number|string} articleId
   * @param {string} status - 'pitch'|'draft'|'in_review'|'scheduled'|'published'|'archived'
   * @param {string|null} [scheduled_at] - ISO string or datetime
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async updateArticleStatus(articleId, status, scheduled_at = null) {
    return api.patch(`/articles/${encodeURIComponent(articleId)}/status`, {
      status,
      scheduled_at,
    });
  },

  /**
   * Trigger immediate scheduled article processing (Super Admin, Task 95).
   * @returns {Promise<{success: boolean, message: string, publishedCount: number}>}
   */
  async processScheduledArticles() {
    return api.post('/articles/process-scheduled');
  },

  /**
   * Fetch authenticated user's cloud bookmarks (Task 97).
   * @returns {Promise<{success: boolean, count: number, data: Array}>}
   */
  async getUserBookmarks() {
    return api.get('/bookmarks');
  },

  /**
   * Toggle article bookmark status in cloud (Task 97).
   * @param {number|string} articleId
   * @returns {Promise<{success: boolean, bookmarked: boolean, message: string}>}
   */
  async toggleCloudBookmark(articleId) {
    return api.post('/bookmarks/toggle', { articleId });
  },

  /**
   * Fetch editorial desk assignments (Task 98).
   * @param {Object} [params] - { status, assigned_to }
   * @returns {Promise<{success: boolean, count: number, data: Array}>}
   */
  async getAssignments(params = {}) {
    return api.get('/assignments', { params });
  },

  /**
   * Create an editorial desk assignment / pitch brief (Task 98).
   * @param {Object} data - { title, brief, assigned_to, department_id, deadline }
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async createAssignment(data) {
    return api.post('/assignments', data);
  },

  /**
   * Update editorial assignment status (Task 98).
   * @param {number|string} id
   * @param {string} status - 'assigned'|'accepted'|'submitted'|'completed'|'cancelled'
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  async updateAssignmentStatus(id, status) {
    return api.patch(`/assignments/${encodeURIComponent(id)}/status`, { status });
  },
};

export default articleService;
