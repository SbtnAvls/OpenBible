import { Platform } from 'react-native';
import * as RNFS from 'react-native-fs';

const directoryNameMain =
  Platform.OS === 'ios'
    ? RNFS.LibraryDirectoryPath
    : RNFS.DocumentDirectoryPath;

export const getDataFromStorage = async (
  dataName: string,
): Promise<any | undefined> => {
  let response: any | undefined;

  try {
    let data = await RNFS.readFile(`${directoryNameMain}/${dataName}`, 'utf8');
    if (data) response = JSON.parse(data);
  } catch (err: any) {
    // Only log if it's not a "file not found" error (expected for first-time reads)
    if (
      err?.code !== 'ENOENT' &&
      err?.message?.indexOf('no such file') === -1
    ) {
      console.warn(`[Storage] Error reading ${dataName}:`, err?.message || err);
    }
  }

  return response;
};

export const saveDataOnStorage = async (
  dataName: string,
  data: string,
): Promise<boolean> => {
  try {
    await RNFS.writeFile(`${directoryNameMain}/${dataName}`, data, 'utf8');
    return true;
  } catch (error: any) {
    console.error(
      `[Storage] Error saving ${dataName}:`,
      error?.message || error,
    );
    return false;
  }
};

export const removeDataFromStorage = async (
  dataNames: string[],
): Promise<boolean> => {
  try {
    for (const attach of dataNames)
      await RNFS.unlink(`${directoryNameMain}/${attach}`);
    return true;
  } catch (error: any) {
    console.error(`[Storage] Error removing files:`, error?.message || error);
    return false;
  }
};
