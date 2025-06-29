import fetch from "node-fetch";
import {
  ZiplineFile,
  ZiplineFilesResponse,
  ZiplineUploadResponse,
  ZiplineStats,
  ZiplineUser,
  ZiplineError,
  UploadOptions,
  FileFilterOptions,
} from "../types/zipline";

export class ZiplineAPI {
  private baseUrl: string;
  private apiToken: string;

  constructor(baseUrl: string, apiToken: string) {
    this.baseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
    this.apiToken = apiToken;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: this.apiToken,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json() as ZiplineError;
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async getUserFiles(options: FileFilterOptions = {}): Promise<ZiplineFilesResponse> {
    const params = new URLSearchParams();
    
    if (options.search) params.append("filter", options.search);
    if (options.mimetype) params.append("mimetype", options.mimetype);
    if (options.favorite !== undefined) params.append("favorite", options.favorite.toString());
    if (options.page) params.append("page", options.page.toString());
    if (options.limit) params.append("limit", options.limit.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/api/user/files?${queryString}` : "/api/user/files";

    return this.makeRequest<ZiplineFilesResponse>(endpoint);
  }

  async uploadFile(file: File, options: Partial<UploadOptions> = {}): Promise<ZiplineUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    if (options.filename) formData.append("filename", options.filename);
    if (options.format) formData.append("format", options.format);
    if (options.overrideDomain) formData.append("overrideDomain", options.overrideDomain);
    if (options.originalName) formData.append("originalName", options.originalName.toString());
    if (options.password) formData.append("password", options.password);
    if (options.embed) formData.append("embed", options.embed.toString());
    if (options.maxViews) formData.append("maxViews", options.maxViews.toString());
    if (options.expiresAt) formData.append("expiresAt", options.expiresAt);

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: this.apiToken,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json() as ZiplineError;
      throw new Error(errorData.message || `Upload failed: ${response.statusText}`);
    }

    return response.json() as Promise<ZiplineUploadResponse>;
  }

  async deleteFile(fileId: number): Promise<void> {
    await this.makeRequest(`/api/user/files/${fileId}`, {
      method: "DELETE",
    });
  }

  async toggleFileFavorite(fileId: number): Promise<void> {
    await this.makeRequest(`/api/user/files/${fileId}/favorite`, {
      method: "PATCH",
    });
  }

  async getFileById(fileId: number): Promise<ZiplineFile> {
    return this.makeRequest<ZiplineFile>(`/api/user/files/${fileId}`);
  }

  async getUserStats(): Promise<ZiplineStats> {
    return this.makeRequest<ZiplineStats>("/api/user/stats");
  }

  async getCurrentUser(): Promise<ZiplineUser> {
    return this.makeRequest<ZiplineUser>("/api/user");
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }
}