import {
  List,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Icon,
  Color,
  Clipboard,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { ZiplineFile } from "../types/zipline";
import { createZiplineClient, formatFileSize, formatDate, getMimeTypeIcon } from "../utils/preferences";

interface State {
  files: ZiplineFile[];
  loading: boolean;
  error?: string;
}

export default function RecentUploads() {
  const [state, setState] = useState<State>({
    files: [],
    loading: true,
  });

  const ziplineClient = createZiplineClient();

  const loadRecentFiles = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      const response = await ziplineClient.getUserFiles({
        limit: 10, // Show last 10 uploads
      });

      // Sort by upload date (most recent first)
      const sortedFiles = response.files.sort((a, b) => 
        new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
      );

      setState((prev) => ({
        ...prev,
        files: sortedFiles,
        loading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load recent files",
      }));
      
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load recent uploads",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    loadRecentFiles();
  }, []);

  const handleCopyUrl = async (url: string) => {
    await Clipboard.copy(url);
    showToast({
      style: Toast.Style.Success,
      title: "URL copied to clipboard",
    });
  };

  const handleToggleFavorite = async (file: ZiplineFile) => {
    try {
      await ziplineClient.toggleFileFavorite(file.id);
      showToast({
        style: Toast.Style.Success,
        title: file.favorite ? "Removed from favorites" : "Added to favorites",
      });
      loadRecentFiles(); // Reload to update favorite status
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to toggle favorite",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const getRelativeTime = (dateString: string): string => {
    const now = new Date();
    const uploadDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - uploadDate.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return formatDate(dateString);
  };

  return (
    <List
      isLoading={state.loading}
      navigationTitle="Recent Uploads"
    >
      {state.error ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Error Loading Recent Files"
          description={state.error}
          actions={
            <ActionPanel>
              <Action 
                title="Retry" 
                icon={Icon.ArrowClockwise}
                onAction={loadRecentFiles} 
              />
            </ActionPanel>
          }
        />
      ) : state.files.length === 0 && !state.loading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No Recent Uploads"
          description="Upload your first file to see it here"
        />
      ) : (
        state.files.map((file, index) => (
          <List.Item
            key={file.id}
            title={file.filename}
            subtitle={formatFileSize(file.size)}
            icon={{
              source: getMimeTypeIcon(file.mimetype),
              tintColor: file.favorite ? Color.Yellow : undefined,
            }}
            accessories={[
              { text: getRelativeTime(file.upload_date) },
              { text: `${file.views} views` },
              file.favorite ? { icon: { source: Icon.Star, tintColor: Color.Yellow } } : {},
            ]}
            actions={
              <ActionPanel>
                <ActionPanel.Section title="File Actions">
                  <Action
                    title="Copy URL"
                    icon={Icon.Link}
                    onAction={() => handleCopyUrl(file.url)}
                  />
                  <Action
                    title="Open in Browser"
                    icon={Icon.Globe}
                    onAction={() => open(file.url)}
                  />
                  <Action
                    title={file.favorite ? "Remove from Favorites" : "Add to Favorites"}
                    icon={file.favorite ? Icon.StarDisabled : Icon.Star}
                    onAction={() => handleToggleFavorite(file)}
                    shortcut={{ modifiers: ["cmd"], key: "f" }}
                  />
                </ActionPanel.Section>
                <ActionPanel.Section title="Navigation">
                  <Action
                    title="Refresh"
                    icon={Icon.ArrowClockwise}
                    onAction={loadRecentFiles}
                    shortcut={{ modifiers: ["cmd"], key: "r" }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );
}