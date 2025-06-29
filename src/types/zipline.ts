export interface ZiplineFile {
  id: number;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
  upload_date: string;
  views: number;
  favorite: boolean;
  embedded: boolean;
  originalName?: string;
  password?: string;
  maxViews?: number;
  expiresAt?: string;
}

export interface ZiplineUploadResponse {
  files: string[];
  url: string;
  upload_date: string;
}

export interface ZiplineFilesResponse {
  files: ZiplineFile[];
  count: number;
  pages: number;
  page: number;
}

export interface ZiplineStats {
  size: number;
  count: number;
  views_count: number;
  users_count: number;
  avg_size: number;
}

export interface ZiplineUser {
  id: number;
  username: string;
  token: string;
  administrator: boolean;
  superAdmin: boolean;
  avatar?: string;
  embedColor?: string;
  ratelimit?: number;
  domains?: string[];
}

export interface ZiplineError {
  error: string;
  message: string;
  statusCode: number;
}

export interface ZiplinePreferences {
  ziplineUrl: string;
  apiToken: string;
  pageSize: string;
}

export interface UploadOptions {
  file: File | string;
  filename?: string;
  format?: "RANDOM" | "DATE" | "UUID" | "GFYCAT" | "ORIGINAL";
  overrideDomain?: string;
  originalName?: boolean;
  password?: string;
  embed?: boolean;
  maxViews?: number;
  expiresAt?: string;
}

export interface FileFilterOptions {
  search?: string;
  mimetype?: string;
  favorite?: boolean;
  page?: number;
  limit?: number;
}