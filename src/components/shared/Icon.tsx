import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { SymbolView, SymbolWeight } from 'expo-symbols';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/hooks/use-theme';

interface IconProps {
  sf: string;
  fallback: string; // Backward compatibility
  size?: number;
  color?: string;
  weight?: SymbolWeight;
}

// Inline SVG path dictionary mapped from SF Symbols keys
const SVG_MAP: Record<string, (color: string) => React.ReactNode> = {
  'ellipsis.vertical': (c) => (
    <>
      <Circle cx="12" cy="5" r="2.5" fill={c} />
      <Circle cx="12" cy="12" r="2.5" fill={c} />
      <Circle cx="12" cy="19" r="2.5" fill={c} />
    </>
  ),
  'doc.text.fill': (c) => (
    <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill={c} />
  ),
  'doc.text': (c) => (
    <Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill={c} />
  ),
  'doc.on.doc': (c) => (
    <Path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill={c} />
  ),
  'trash': (c) => (
    <Path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill={c} />
  ),
  'trash.fill': (c) => (
    <Path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill={c} />
  ),
  'arrow.clockwise': (c) => (
    <Path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill={c} />
  ),
  'chevron.left': (c) => (
    <Path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill={c} />
  ),
  'chevron.right': (c) => (
    <Path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill={c} />
  ),
  'crop': (c) => (
    <Path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z" fill={c} />
  ),
  'rotate.right': (c) => (
    <Path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6c0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 9.03 4 10.49 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill={c} />
  ),
  'plus': (c) => (
    <Path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill={c} />
  ),
  'text.viewfinder': (c) => (
    <Path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14zM8 6h8v2H8zm0 3h8v2H8zm0 3h5v2H8z" fill={c} />
  ),
  'info.circle': (c) => (
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill={c} />
  ),
  'lock.fill': (c) => (
    <Path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill={c} />
  ),
  'cloud.fill': (c) => (
    <Path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill={c} />
  ),
  'link': (c) => (
    <Path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill={c} />
  ),
  'camera.fill': (c) => (
    <>
      <Path d="M19 18H5a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 5 6h2.2a1 1 0 0 0 .8-.4l1.2-1.5a1.8 1.8 0 0 1 1.4-.6h2.8c.5 0 1 .2 1.4.6l1.2 1.5c.2.2.5.4.8.4H19a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 19 18z" fill={c} opacity="0.12" />
      <Path d="M19 18H5a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 5 6h2.2a1 1 0 0 0 .8-.4l1.2-1.5a1.8 1.8 0 0 1 1.4-.6h2.8c.5 0 1 .2 1.4.6l1.2 1.5c.2.2.5.4.8.4H19a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 19 18z" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="11.8" r="3.2" stroke={c} strokeWidth="1.8" fill="none" />
      <Circle cx="12" cy="11.8" r="1.3" fill={c} />
      <Circle cx="17.2" cy="8.8" r="0.9" fill={c} />
    </>
  ),
  'square.and.arrow.up.fill': (c) => (
    <Path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.8 2.04.8 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" fill={c} />
  ),
  'square.and.arrow.up': (c) => (
    <Path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.8 2.04.8 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" fill={c} />
  ),
  'printer.fill': (c) => (
    <Path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" fill={c} />
  ),
  'xmark': (c) => (
    <Path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill={c} />
  ),
  'magnifyingglass': (c) => (
    <Path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill={c} />
  ),
  'line.3.horizontal.decrease': (c) => (
    <Path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm5 7h8v-2H8v2z" fill={c} />
  ),
  'heart.fill': (c) => (
    <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={c} />
  ),
  'heart.slash.fill': (c) => (
    <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={c} />
  ),
  'pencil': (c) => (
    <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill={c} />
  ),
  'checkmark.circle.fill': (c) => (
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill={c} />
  ),
  'circle': (c) => (
    <Path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill={c} />
  ),
  'play.fill': (c) => (
    <Path d="M8 5v14l11-7z" fill={c} />
  ),
  'chevron.up.chevron.down': (c) => (
    <Path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z" fill={c} />
  ),
  'xmark.circle.fill': (c) => (
    <Path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" fill={c} />
  ),
  'slider.horizontal.3': (c) => (
    <Path d="M3 17v2h6v-2H3zm0-10v2h10V7H3zm10 12v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4V7H3V5h12V3h2v6h-2z" fill={c} />
  ),
  'arrow.triangle.2.circlepath': (c) => (
    <Path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 9.03 4 10.49 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" fill={c} />
  ),
  'checkmark': (c) => (
    <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill={c} />
  ),
  'camera.shutter.button': (c) => (
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill={c} />
  ),
  'bolt.fill': (c) => (
    <Path d="M7 2v11h3v9l7-12h-4l4-8z" fill={c} />
  ),
  'bolt.slash.fill': (c) => (
    <Path d="M7 2v11h3v9l7-12h-4l4-8z M19 3L4 18l1.4 1.4L20.4 4.4z" fill={c} />
  ),
  'grid': (c) => (
    <Path d="M4 11h5V5H4v6zm0 8h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-8h5V5h-5v6zm6-6v6h5V5h-5z" fill={c} />
  ),
  'play.circle.fill': (c) => (
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill={c} />
  ),
  'hand.tap.fill': (c) => (
    <Path d="M12 2a5 5 0 0 0-5 5v5.58l-1.3-.65a1.5 1.5 0 0 0-2.07.67 1.5 1.5 0 0 0 .67 2.07l5.22 2.61c.31.15.58.37.78.65L12.5 21a1.5 1.5 0 0 0 3 0v-7.5a1.5 1.5 0 0 0-3 0v-4A1.5 1.5 0 0 0 11 8V7a1 1 0 0 1 2 0v2.5a1 1 0 0 0 2 0V7a3 3 0 0 0-3-3z" fill={c} />
  ),
  'photo': (c) => (
    <Path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" fill={c} />
  ),
  'camera.aperture': (c) => (
    <Path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill={c} />
  ),
  'chevron.down': (c) => (
    <Path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" fill={c} />
  ),
  'house.fill': (c) => (
    <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={c} />
  ),
  'gearshape.fill': (c) => (
    <Path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill={c} />
  ),
  'wand.and.stars': (c) => (
    <>
      <Path d="M12 3l.6 1.4L14 5l-1.4.6-.6 1.4-.6-1.4L10 5l1.4-.6z M19 7l.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4z" fill={c} />
      <Path d="M3.5 19.1l1.4 1.4L16.2 9.2l-1.4-1.4z" fill={c} opacity="0.9" />
      <Path d="M17.6 7.8l-1.4-1.4 1.4-1.4 1.4 1.4z" fill={c} />
    </>
  ),
};

export function Icon({ sf, size = 20, color, weight = 'regular' }: IconProps) {
  const theme = useTheme();
  const iconColor = color || theme.text;

  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={sf as any}
        size={size}
        tintColor={iconColor}
        weight={weight}
      />
    );
  }

  // Draw pure SVG vector on Android / Web
  const drawPaths = SVG_MAP[sf];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width="100%" height="100%" viewBox="0 0 24 24">
        {drawPaths ? (
          drawPaths(iconColor)
        ) : (
          // Default fallback icon: Simple Help Question Circle
          <>
            <Circle cx="12" cy="12" r="10" stroke={iconColor} strokeWidth="2" fill="none" />
            <Circle cx="12" cy="16" r="1" fill={iconColor} />
            <Path d="M12 14v-2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2" stroke={iconColor} strokeWidth="2" fill="none" />
          </>
        )}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Icon;
