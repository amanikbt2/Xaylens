import React, { forwardRef } from 'react';
import { CameraViewProps, CameraViewRef } from './cameraTypes';

// Metro bundler will automatically import NativeCameraView.native.tsx on mobile
// and WebCameraView.web.tsx on Web.
// We also export the standard fallback here.
let Implementation: React.ForwardRefExoticComponent<CameraViewProps & React.RefAttributes<CameraViewRef>>;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Implementation = require('./NativeCameraView').PlatformCameraView;
} catch {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Implementation = require('./WebCameraView').PlatformCameraView;
}

export const PlatformCamera = forwardRef<CameraViewRef, CameraViewProps>((props, ref) => {
  return <Implementation {...props} ref={ref} />;
});

PlatformCamera.displayName = 'PlatformCamera';
