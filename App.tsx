import React from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CameraScreen } from './src/screens/CameraScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        <CameraScreen />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
