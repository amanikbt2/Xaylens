import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

const RENDER_WEB_URL = 'https://xaylens.onrender.com/';

interface OnlineLensContainerProps {
  onSwitchToNative: () => void;
  onOpenSettings: () => void;
}

export const OnlineLensContainer: React.FC<OnlineLensContainerProps> = ({
  onSwitchToNative,
  onOpenSettings,
}) => {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setErrorMessage(null);
    setIsLoading(true);
    webViewRef.current?.reload();
  }, []);

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* FULL SCREEN WEBGL LENS CONTAINER */}
      <WebView
        ref={webViewRef}
        source={{ uri: RENDER_WEB_URL }}
        style={styles.webView}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        // Auto grant camera & microphone inside WebView on Android
        mediaCapturePermissionGrantType="grant"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        cacheEnabled={true}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setHasError(true);
          setErrorMessage(nativeEvent.description || 'Connection failed');
          setIsLoading(false);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          if (nativeEvent.statusCode >= 400) {
            setHasError(true);
            setErrorMessage(`Server unreachable (${nativeEvent.statusCode})`);
          }
        }}
      />

      {/* TOP FLOATING CONTROLS: QUICK STATUS & SWITCH TO NATIVE */}
      <View style={[styles.topBar, { top: Math.max(insets.top + 8, 16) }]} pointerEvents="box-none">
        <View style={styles.engineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.engineBadgeText}>Online WebGL</Text>
        </View>

        <View style={styles.topActions} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.nativeSwitchPill}
            onPress={onSwitchToNative}
            activeOpacity={0.8}
          >
            <Ionicons name="camera-reverse-outline" size={15} color="#09090b" />
            <Text style={styles.nativeSwitchText}>Use Native</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingsIconBtn}
            onPress={onOpenSettings}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={18} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* LOADING INDICATOR */}
      {isLoading && !hasError && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={Colors.accentYellow} />
          <Text style={styles.loadingText}>Loading WebGL Lenses…</Text>
          <Text style={styles.loadingSubtext}>Connecting to xaylens.onrender.com</Text>
        </View>
      )}

      {/* OFFLINE / CONNECTION ERROR MODAL BANNER */}
      {hasError && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <View style={styles.errorIconCircle}>
              <Ionicons name="cloud-offline-outline" size={42} color={Colors.accentYellow} />
            </View>

            <Text style={styles.errorTitle}>You're Offline</Text>
            <Text style={styles.errorDescription}>
              Unable to reach the online WebGL lens server. Switch to native lenses to use Xaylens without internet connection.
            </Text>

            {errorMessage ? (
              <Text style={styles.errorDetails}>{errorMessage}</Text>
            ) : null}

            <View style={styles.errorButtonStack}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={onSwitchToNative}
                activeOpacity={0.85}
              >
                <Ionicons name="camera-outline" size={18} color="#09090b" />
                <Text style={styles.primaryActionButtonText}>Switch to Native Lenses</Text>
              </TouchableOpacity>

              <View style={styles.secondaryButtonRow}>
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={handleRetry}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={16} color="#ffffff" />
                  <Text style={styles.secondaryActionButtonText}>Retry</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={onOpenSettings}
                  activeOpacity={0.8}
                >
                  <Ionicons name="settings-outline" size={16} color="#ffffff" />
                  <Text style={styles.secondaryActionButtonText}>Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#000000',
    zIndex: 999,
  },
  webView: {
    flex: 1,
    backgroundColor: '#000000',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 9, 11, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  engineBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nativeSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentYellow,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nativeSwitchText: {
    color: '#09090b',
    fontSize: 12,
    fontWeight: '700',
  },
  settingsIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(9, 9, 11, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    gap: 8,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  loadingSubtext: {
    color: '#a1a1aa',
    fontSize: 12,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    zIndex: 150,
  },
  errorCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#18181b',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.25)',
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  errorDescription: {
    color: '#a1a1aa',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  errorDetails: {
    color: '#f87171',
    fontSize: 11,
    marginBottom: 16,
  },
  errorButtonStack: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  primaryActionButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentYellow,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  primaryActionButtonText: {
    color: '#09090b',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButtonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#27272a',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#3f3f46',
  },
  secondaryActionButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
});
