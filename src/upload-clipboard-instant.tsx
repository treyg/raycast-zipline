import {
  showToast,
  Toast,
  Clipboard,
  closeMainWindow,
  showHUD,
} from "@raycast/api";
import { createZiplineClient } from "./utils/preferences";

export default async function UploadClipboardInstant() {
  try {
    // Get clipboard text
    const clipboardText = await Clipboard.readText();
    
    if (!clipboardText || clipboardText.trim().length === 0) {
      await showHUD("❌ No text found in clipboard");
      return;
    }

    await showHUD("⏳ Uploading clipboard text...");
    
    // Close Raycast window immediately to feel instant
    await closeMainWindow();

    const ziplineClient = createZiplineClient();

    // Create a temporary file - the server seems to need an actual file
    const fs = require('fs');
    const os = require('os');
    const path = require('path');
    
    const tempDir = os.tmpdir();
    const filename = `clipboard-${Date.now()}.txt`;
    const tempFilePath = path.join(tempDir, filename);
    
    // Write text to temporary file
    fs.writeFileSync(tempFilePath, clipboardText, 'utf8');
    
    const uploadResponse = await ziplineClient.uploadFile(tempFilePath, filename, {
      format: "RANDOM",
    });

    // Clean up temporary file
    try {
      fs.unlinkSync(tempFilePath);
    } catch (e) {
      // Ignore cleanup errors
    }
    
    if (Array.isArray(uploadResponse.files) && uploadResponse.files.length > 0) {
      const uploadUrl = uploadResponse.files[0].url;
      
      // Copy URL to clipboard
      await Clipboard.copy(uploadUrl);
      
      await showHUD("✅ Text uploaded! URL copied to clipboard");
    } else {
      await showHUD(`❌ Upload failed - no files returned`);
    }

  } catch (error) {
    await showHUD(`❌ Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}