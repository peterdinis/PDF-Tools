/**
 * Utility functions for downloading files with proper error handling
 */

export interface DownloadOptions {
  filename?: string;
  mimeType?: string;
  delay?: number; // Delay in ms for multiple downloads
}

/**
 * Download a blob as a file
 */
export async function downloadBlob(
  blob: Blob,
  filename: string,
  options?: DownloadOptions,
): Promise<boolean> {
  try {
    // Add delay if specified (useful for multiple downloads)
    if (options?.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    // Append to body, click, then remove
    document.body.appendChild(link);

    // Use requestAnimationFrame to ensure the link is in the DOM
    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        link.click();
        resolve(undefined);
      });
    });

    // Clean up after a short delay
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    return true;
  } catch (error) {
    console.error("Download failed:", error);
    return false;
  }
}

/**
 * Download a file from a blob URL
 */
export async function downloadFromUrl(
  url: string,
  filename: string,
  options?: DownloadOptions,
): Promise<boolean> {
  try {
    if (options?.delay) {
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);

    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        link.click();
        resolve(undefined);
      });
    });

    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);

    return true;
  } catch (error) {
    console.error("Download failed:", error);
    return false;
  }
}

/**
 * Download multiple files sequentially with delays
 */
export async function downloadMultiple(
  files: Array<{ blob: Blob; filename: string }>,
  delayBetweenDownloads: number = 200,
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const file of files) {
    const result = await downloadBlob(file.blob, file.filename, {
      delay: delayBetweenDownloads,
    });
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Download text content as a file
 */
export async function downloadText(
  content: string,
  filename: string,
  mimeType: string = "text/plain",
): Promise<boolean> {
  const blob = new Blob([content], { type: mimeType });
  return downloadBlob(blob, filename);
}
