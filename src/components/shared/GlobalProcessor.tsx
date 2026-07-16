import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  registerWebView,
  handleWebViewMessage,
  getProcessorHtml,
  downloadOfflineLibraries,
} from '@/services/processor';

export function GlobalProcessor() {
  const [html, setHtml] = useState<string | null>(null);

  const handleRef = React.useCallback((ref: WebView | null) => {
    if (ref) {
      registerWebView(ref);
    }
  }, []);

  useEffect(() => {
    // Check and pre-download the libraries for offline usage
    downloadOfflineLibraries();

    // Load HTML string
    getProcessorHtml().then((content) => {
      setHtml(content);
    });
  }, []);

  if (!html) return null;

  return (
    <View style={styles.hiddenContainer} pointerEvents="none">
      <WebView
        ref={handleRef}
        source={{ html }}
        onMessage={(event) => {
          handleWebViewMessage(event.nativeEvent.data);
        }}
        originWhitelist={['*']}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowFileAccess={true}
        allowUniversalAccessFromFileURLs={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hiddenContainer: {
    width: 1,
    height: 1,
    opacity: 0,
    position: 'absolute',
    left: -100,
    top: -100,
    overflow: 'hidden',
  },
});
