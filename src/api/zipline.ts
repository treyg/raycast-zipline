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
  public baseUrl: string;
  public apiToken: string;

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
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    } as any);

    if (!response.ok) {
      let errorMessage;
      try {
        const errorData = (await response.json()) as ZiplineError;
        errorMessage =
          errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  async getUserFiles(options: FileFilterOptions = {}): Promise<ZiplineFile[]> {
    const params = new URLSearchParams();

    if (options.search) params.append("filter", options.search);
    if (options.mimetype) params.append("mimetype", options.mimetype);
    if (options.favorite !== undefined)
      params.append("favorite", options.favorite.toString());

    // Page parameter is required
    params.append("page", (options.page || 1).toString());

    const endpoint = `/api/user/files?${params.toString()}`;

    const response = await this.makeRequest<{ page: ZiplineFile[] }>(endpoint);
    return response.page || [];
  }

  async uploadFile(
    filePath: string,
    fileName: string,
    options: Partial<UploadOptions> = {}
  ): Promise<ZiplineUploadResponse> {
    const fs = require("fs");
    const FormData = require("form-data");

    // Check if file exists and has content
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    const fileStats = fs.statSync(filePath);

    if (fileStats.size === 0) {
      throw new Error(`File is empty: ${filePath}`);
    }

    const formData = new FormData();
    const fileBuffer = fs.readFileSync(filePath);
    formData.append("file", fileBuffer, fileName);

    const headers: Record<string, string> = {
      Authorization: this.apiToken,
      ...formData.getHeaders(),
    };

    if (options.format)
      headers["x-zipline-format"] = options.format.toLowerCase();
    if (options.overrideDomain)
      headers["x-zipline-domain"] = options.overrideDomain;
    if (options.originalName) headers["x-zipline-original-name"] = "true";
    if (options.password) headers["x-zipline-password"] = options.password;
    if (options.maxViews)
      headers["x-zipline-max-views"] = options.maxViews.toString();
    if (options.expiresAt) headers["x-zipline-deletes-at"] = options.expiresAt;
    if (options.filename) headers["x-zipline-filename"] = options.filename;

    const response = await fetch(`${this.baseUrl}/api/upload`, {
      method: "POST",
      headers,
      body: formData as any,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }

    const responseData = await response.json();
    return responseData as ZiplineUploadResponse;
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.makeRequest(`/api/user/files/${fileId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        delete: "file",
        id: fileId
      }),
    });
  }

  async toggleFileFavorite(fileId: string): Promise<void> {
    await this.makeRequest(`/api/user/files/${fileId}/favorite`, {
      method: "PATCH",
    });
  }

  async getFileById(fileId: string): Promise<ZiplineFile> {
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
