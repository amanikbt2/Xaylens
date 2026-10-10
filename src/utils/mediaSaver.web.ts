import { CapturedMedia } from '../types/camera';

export interface SaveMediaResult {
  success: boolean;
  message: string;
}

const getFileExtension = (media: CapturedMedia): string => {
  if (media.type !== 'video') return 'jpg';

  const mimeType = media.mimeType?.toLowerCase() || '';
  if (mimeType.includes('mp4')) return 'mp4';
  if (mimeType.includes('quicktime')) return 'mov';
  return 'webm';
};

export const saveMediaToDevice = async (media: CapturedMedia): Promise<SaveMediaResult> => {
  try {
    if (typeof document === 'undefined') {
      return { success: false, message: 'Web environment unavailable.' };
    }
    const a = document.createElement('a');
    a.href = media.uri;
    const ext = getFileExtension(media);
    a.download = `Xaylens_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return {
      success: true,
      message:
        media.type === 'video'
          ? `Video downloaded as ${ext.toUpperCase()}.`
          : 'Media downloaded successfully.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to download media.';
    return {
      success: false,
      message: errorMsg,
    };
  }
};
