import React, { forwardRef } from 'react';
import { Platform } from 'react-native';
import { CameraViewProps, CameraViewRef } from './cameraTypes';

let Implementation: React.ForwardRefExoticComponent<CameraViewProps & React.RefAttributes<CameraViewRef>>;

if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Implementation = require('./WebCameraView.web').PlatformCameraView;
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Implementation = require('./NativeCameraView.native').PlatformCameraView;
}

export const PlatformCamera = forwardRef<CameraViewRef, CameraViewProps>((props, ref) => {
  return <Implementation {...props} ref={ref} />;
});

PlatformCamera.displayName = 'PlatformCamera';
