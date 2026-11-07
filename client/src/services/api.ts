const API_BASE = import.meta.env.VITE_API_URL || '/api';

interface RequestOptions extends RequestInit {
  data?: any;
}

class ApiService {
  private async request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { data, headers, ...customConfig } = options;
    const isFormData = data instanceof FormData;

    const config: RequestInit = {
      method: options.method || 'GET',
      headers: {
        ...(!isFormData && { 'Content-Type': 'application/json' }),
        ...headers,
      },
      credentials: 'include', // Includes HTTP-only cookies
      ...customConfig,
    };

    if (data) {
      config.body = isFormData ? data : JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // Handle file downloads (blob streams)
    const contentType = response.headers.get('content-type') || '';
    if (
      response.ok &&
      (options.method === 'GET' &&
        (endpoint.includes('/download') || endpoint.includes('/preview')))
    ) {
      if (endpoint.includes('/download')) {
        const blob = await response.blob();
        return blob as unknown as T;
      }
    }

    let json: any;
    try {
      json = await response.json();
    } catch {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      return {} as T;
    }

    if (!response.ok || (json && json.success === false)) {
      const errorMsg = json?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return json.data !== undefined ? json.data : json;
  }

  // Auth Endpoints
  public async login(credentials: { email: string; password: string }) {
    return this.request('/auth/login', { method: 'POST', data: credentials });
  }

  public async register(userData: { name: string; email: string; password: string }) {
    return this.request('/auth/register', { method: 'POST', data: userData });
  }

  public async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  public async getMe() {
    return this.request('/auth/me');
  }

  public async forgotPassword(email: string) {
    return this.request('/auth/forgot-password', { method: 'POST', data: { email } });
  }

  public async resetPassword(payload: { token: string; password: string }) {
    return this.request('/auth/reset-password', { method: 'POST', data: payload });
  }

  public async updateProfile(payload: { name?: string; currentPassword?: string; newPassword?: string }) {
    return this.request('/auth/profile', { method: 'PATCH', data: payload });
  }

  // User Management
  public async getUsers(params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/users?${query}`);
  }

  public async createUser(userData: any) {
    return this.request('/users', { method: 'POST', data: userData });
  }

  public async updateUser(userId: string, updateData: any) {
    return this.request(`/users/${userId}`, { method: 'PATCH', data: updateData });
  }

  public async getDashboardStats() {
    return this.request('/users/dashboard-stats');
  }

  // File Operations
  public async getFiles(params?: {
    folder?: string;
    search?: string;
    filter?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/files?${query}`);
  }

  public async getFileById(fileId: string) {
    return this.request(`/files/${fileId}`);
  }

  public async uploadFile(formData: FormData) {
    return this.request('/files/upload', {
      method: 'POST',
      data: formData,
    });
  }

  public async uploadNewVersion(fileId: string, formData: FormData) {
    return this.request(`/files/${fileId}/versions`, {
      method: 'POST',
      data: formData,
    });
  }

  public async updateFile(fileId: string, payload: { originalName?: string; folder?: string }) {
    return this.request(`/files/${fileId}`, {
      method: 'PATCH',
      data: payload,
    });
  }

  public async deleteFile(fileId: string) {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  public async downloadFile(fileId: string, filename: string) {
    const blob = await this.request<Blob>(`/files/${fileId}/download`);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  public async previewFileText(fileId: string): Promise<string> {
    const res = await fetch(`${API_BASE}/files/${fileId}/preview`, {
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to preview file.');
    }
    return res.text();
  }

  public getPreviewBlobUrl(fileId: string): string {
    return `${API_BASE}/files/${fileId}/preview`;
  }

  // Permissions
  public async getFilePermissions(fileId: string) {
    return this.request(`/permissions/${fileId}`);
  }

  public async grantPermission(payload: {
    userId: string;
    fileId: string;
    canRead?: boolean;
    canDownload?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    canManagePermissions?: boolean;
  }) {
    return this.request('/permissions', {
      method: 'POST',
      data: payload,
    });
  }

  public async revokePermission(fileId: string, userId: string) {
    return this.request(`/permissions/${fileId}/${userId}`, {
      method: 'DELETE',
    });
  }

  // Audit Logs
  public async getAuditLogs(params?: any) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/audit-logs?${query}`);
  }

  public async getAuditStats() {
    return this.request('/audit-logs/stats');
  }

  // Notifications
  public async getNotifications() {
    return this.request('/notifications');
  }

  public async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  public async markAllNotificationsAsRead() {
    return this.request('/notifications/mark-all-read', { method: 'PATCH' });
  }

  // Admin-Only Encryption & Decryption System
  public async generateCryptoKey() {
    return this.request('/crypto/generate-key', { method: 'POST' });
  }

  public async getCryptoKeyInfo() {
    return this.request('/crypto/key-info');
  }

  public async encryptData(payload: FormData | { plaintext: string; keyHex?: string; originalName?: string; folder?: string; saveToVault?: boolean }) {
    return this.request('/crypto/encrypt', {
      method: 'POST',
      data: payload,
    });
  }

  public async decryptData(payload: FormData | { ciphertext?: string; nonce?: string; authTag?: string; keyHex?: string; bundleJson?: string }) {
    return this.request('/crypto/decrypt', {
      method: 'POST',
      data: payload,
    });
  }
}

export const api = new ApiService();

