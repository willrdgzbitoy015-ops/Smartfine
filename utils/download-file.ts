import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

// ==========================================
// DOWNLOAD FILE
// Saves a file the server sent as the answer to a request.
//   - On the web the browser downloads it, so it lands in the Downloads folder
//     (and shows in the browser's download list).
//   - On a phone it is written to the app's cache and the share sheet opens, so
//     it can be saved to Files / Downloads or sent somewhere.
// ==========================================

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x2000;

  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(index, index + chunk)));
  }

  return btoa(binary);
}

export async function saveResponseAsFile(
  response: Response,
  fileName: string,
  mimeType = "application/octet-stream",
): Promise<void> {
  if (Platform.OS === "web") {
    const blob = new Blob([await response.arrayBuffer()], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    // Give the browser a moment to start the download before the link is freed.
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    return;
  }

  const directory = FileSystem.cacheDirectory;

  if (!directory) {
    throw new Error("The device storage is unavailable.");
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error("Saving files is not available on this device.");
  }

  const uri = `${directory}${fileName}`;

  await FileSystem.writeAsStringAsync(uri, toBase64(new Uint8Array(await response.arrayBuffer())), {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Sharing.shareAsync(uri, { mimeType, dialogTitle: fileName });
}
