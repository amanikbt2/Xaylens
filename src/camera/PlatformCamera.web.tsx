import React, { forwardRef } from 'react';
import { CameraViewProps, CameraViewRef } from './cameraTypes';
import { PlatformCameraView } from './WebCameraView.web';

export const PlatformCamera = forwardRef<CameraViewRef, CameraViewProps>((props, ref) => {
  return <PlatformCameraView {...props} ref={ref} />;
});

PlatformCamera.displayName = 'PlatformCamera';
