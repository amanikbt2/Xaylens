import { CapturedMedia } from '../types/camera';

export interface SaveMediaResult {
  success: boolean;
  message: string;
}

export const saveMediaToDevice = async (media: CapturedMedia): Promise<SaveMediaResult> => {
  try {
    if (typeof document === 'undefined') {
      return { success: false, message: 'Web environment unavailable.' };
    }
    const a = document.createElement('a');
    a.href = media.uri;
    const ext = media.type === 'video' ? 'webm' : 'jpg';
    a.download = `XayLens_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { success: true, message: 'Media downloaded successfully.' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to download media.';
    return {
      success: false,
      message: errorMsg,
    };
  }
};
