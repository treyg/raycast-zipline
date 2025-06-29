import {
  List,
  ActionPanel,
  Action,
  showToast,
  Toast,
  getPreferenceValues,
  Icon,
  Color,
  Clipboard,
  confirmAlert,
  Alert,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { ZiplineFile, ZiplineFilesResponse } from "../types/zipline";
import { createZiplineClient, formatFileSize, formatDate, getMimeTypeIcon, getPageSize } from "../utils/preferences";

interface State {
  files: ZiplineFile[];
  loading: boolean;
  error?: string;
  searchText: string;
  page: number;
  totalPages: number;
  totalCount: number;
}

export default function BrowseUploads() {
  const [state, setState] = useState<State>({
    files: [],
    loading: true,
    searchText: "",
    page: 1,
    totalPages: 1,
    totalCount: 0,
  });

  const ziplineClient = createZiplineClient();
  const pageSize = getPageSize();

  const loadFiles = async (page: number = 1, search?: string) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: undefined }));

      const response: ZiplineFilesResponse = await ziplineClient.getUserFiles({
        search: search || undefined,
        page,
        limit: pageSize,
      });

      setState((prev) => ({
        ...prev,
        files: response.files,
        loading: false,
        page,
        totalPages: response.pages,
        totalCount: response.count,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load files",
      }));
      
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load files",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleSearch = (text: string) => {
    setState((prev) => ({ ...prev, searchText: text }));
    loadFiles(1, text);
  };

  const handleToggleFavorite = async (file: ZiplineFile) => {
    try {
      await ziplineClient.toggleFileFavorite(file.id);
      showToast({
        style: Toast.Style.Success,
        title: file.favorite ? "Removed from favorites" : "Added to favorites",
      });
      loadFiles(state.page, state.searchText);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to toggle favorite",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  const handleDeleteFile = async (file: ZiplineFile) => {
    const confirmed = await confirmAlert({
      title: "Delete File",
      message: `Are you sure you want to delete "${file.filename}"? This action cannot be undone.`,
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      try {
        await ziplineClient.deleteFile(file.id);
        showToast({
          style: Toast.Style.Success,
          title: "File deleted successfully",
        });
        loadFiles(state.page, state.searchText);
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to delete file",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };

  const handleCopyUrl = async (url: string) => {
    await Clipboard.copy(url);
    showToast({
      style: Toast.Style.Success,
      title: "URL copied to clipboard",
    });
  };

  const handleNextPage = () => {
    if (state.page < state.totalPages) {
      loadFiles(state.page + 1, state.searchText);
    }
  };

  const handlePreviousPage = () => {
    if (state.page > 1) {
      loadFiles(state.page - 1, state.searchText);
    }
  };

  return (
    <List
      isLoading={state.loading}
      onSearchTextChange={handleSearch}
      searchBarPlaceholder="Search your uploads..."
      navigationTitle={`Uploads (${state.totalCount} total)`}
    >
      {state.error ? (
        <List.EmptyView
          icon={Icon.ExclamationMark}
          title="Error Loading Files"
          description={state.error}
          actions={
            <ActionPanel>
              <Action title="Retry" onAction={() => loadFiles(state.page, state.searchText)} />
            </ActionPanel>
          }
        />
      ) : state.files.length === 0 && !state.loading ? (
        <List.EmptyView
          icon={Icon.Document}
          title="No Files Found"
          description={state.searchText ? "Try adjusting your search query" : "Upload your first file to get started"}
        />
      ) : (
        <>
          {state.files.map((file) => (
            <List.Item
              key={file.id}
              title={file.filename}
              subtitle={`${formatFileSize(file.size)} • ${formatDate(file.upload_date)}`}
              icon={{
                source: getMimeTypeIcon(file.mimetype),
                tintColor: file.favorite ? Color.Yellow : undefined,
              }}
              accessories={[
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
                  <ActionPanel.Section title="Danger Zone">
                    <Action
                      title="Delete File"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      onAction={() => handleDeleteFile(file)}
                      shortcut={{ modifiers: ["cmd"], key: "delete" }}
                    />
                  </ActionPanel.Section>
                  <ActionPanel.Section title="Navigation">
                    {state.page > 1 && (
                      <Action
                        title="Previous Page"
                        icon={Icon.ArrowLeft}
                        onAction={handlePreviousPage}
                        shortcut={{ modifiers: ["cmd"], key: "arrowLeft" }}
                      />
                    )}
                    {state.page < state.totalPages && (
                      <Action
                        title="Next Page"
                        icon={Icon.ArrowRight}
                        onAction={handleNextPage}
                        shortcut={{ modifiers: ["cmd"], key: "arrowRight" }}
                      />
                    )}
                    <Action
                      title="Refresh"
                      icon={Icon.ArrowClockwise}
                      onAction={() => loadFiles(state.page, state.searchText)}
                      shortcut={{ modifiers: ["cmd"], key: "r" }}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
          {state.totalPages > 1 && (
            <List.Item
              title={`Page ${state.page} of ${state.totalPages}`}
              icon={Icon.Dot}
              actions={
                <ActionPanel>
                  {state.page > 1 && (
                    <Action
                      title="Previous Page"
                      icon={Icon.ArrowLeft}
                      onAction={handlePreviousPage}
                    />
                  )}
                  {state.page < state.totalPages && (
                    <Action
                      title="Next Page"
                      icon={Icon.ArrowRight}
                      onAction={handleNextPage}
                    />
                  )}
                </ActionPanel>
              }
            />
          )}
        </>
      )}
    </List>
  );
}