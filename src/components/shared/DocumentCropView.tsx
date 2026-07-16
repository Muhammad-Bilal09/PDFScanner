import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Image,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import Svg, { Polygon, Line } from 'react-native-svg';
import { Point } from '@/services/processor';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius, Typography, Shadows } from '@/theme';
import { OutlineButton } from './OutlineButton';
import { PrimaryButton } from './PrimaryButton';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

interface DocumentCropViewProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  initialPoints: Point[];
  onCancel: () => void;
  onSave: (points: Point[]) => void;
}

export function DocumentCropView({
  imageUri,
  imageWidth,
  imageHeight,
  initialPoints,
  onCancel,
  onSave,
}: DocumentCropViewProps) {
  const theme = useTheme();

  // Corner state (array of 4 normalized points: TL, TR, BR, BL)
  const [points, setPoints] = useState<Point[]>(initialPoints);
  
  // Track layout dimensions of the image canvas container
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

  // Drag states for magnifying glass
  const [activeCorner, setActiveCorner] = useState<number>(-1);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate image fit dimensions and offsets inside the container
  const layout = useMemo(() => {
    if (!containerSize || !imageWidth || !imageHeight) return null;

    const winW = containerSize.width;
    const winH = containerSize.height;

    const ratioImg = imageWidth / imageHeight;
    const ratioWin = winW / winH;

    let fitW = winW;
    let fitH = winH;
    let offsetX = 0;
    let offsetY = 0;

    if (ratioImg > ratioWin) {
      // Image is wider than container aspect ratio
      fitW = winW;
      fitH = winW / ratioImg;
      offsetY = (winH - fitH) / 2;
    } else {
      // Image is taller than container aspect ratio
      fitH = winH;
      fitW = winH * ratioImg;
      offsetX = (winW - fitW) / 2;
    }

    return { fitW, fitH, offsetX, offsetY };
  }, [containerSize, imageWidth, imageHeight]);

  // Map normalized coordinate to screen coordinates
  const getScreenCoords = (p: Point) => {
    if (!layout) return { x: 0, y: 0 };
    return {
      x: layout.offsetX + p.x * layout.fitW,
      y: layout.offsetY + p.y * layout.fitH,
    };
  };

  // Convert screen coordinates back to normalized (0 - 1) image coordinates
  const getNormalizedCoords = (x: number, y: number) => {
    if (!layout) return { x: 0, y: 0 };
    const nX = Math.max(0, Math.min(1, (x - layout.offsetX) / layout.fitW));
    const nY = Math.max(0, Math.min(1, (y - layout.offsetY) / layout.fitH));
    return { x: nX, y: nY };
  };

  // Render SVG connection lines connecting points: 0->1->2->3->0
  const polyPointsString = useMemo(() => {
    if (!layout) return '';
    return points
      .map((p) => {
        const s = getScreenCoords(p);
        return `${s.x},${s.y}`;
      })
      .join(' ');
  }, [points, layout]);

  // Determine closest corner to the touch start
  const handleTouchStart = (event: GestureResponderEvent) => {
    if (!layout) return;
    const { locationX, locationY } = event.nativeEvent;
    
    // Find the handle within a touch tolerance threshold (40px)
    let closestIndex = -1;
    let minDistance = 40; // max touch radius

    points.forEach((p, idx) => {
      const s = getScreenCoords(p);
      const dist = Math.hypot(locationX - s.x, locationY - s.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    if (closestIndex !== -1) {
      setActiveCorner(closestIndex);
      setDragPosition({ x: locationX, y: locationY });
    }
  };

  // Drag responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouchStart(evt);
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!layout) return;
        
        // Find which corner we are dragging
        // To be safe, look at activeCorner
        setActiveCorner((currentActive) => {
          if (currentActive === -1) return -1;
          
          const touchX = evt.nativeEvent.locationX;
          const touchY = evt.nativeEvent.locationY;

          setDragPosition({ x: touchX, y: touchY });
          const norm = getNormalizedCoords(touchX, touchY);

          setPoints((prevPoints) => {
            const updated = [...prevPoints];
            updated[currentActive] = norm;
            return updated;
          });

          return currentActive;
        });
      },
      onPanResponderRelease: () => {
        setActiveCorner(-1);
      },
      onPanResponderTerminate: () => {
        setActiveCorner(-1);
      },
    })
  ).current;

  // Position of handles for screen rendering
  const screenPoints = useMemo(() => {
    return points.map((p) => getScreenCoords(p));
  }, [points, layout]);

  // Magnifier layout details
  const magnifierOffset = useMemo(() => {
    if (activeCorner === -1 || !layout) return null;
    const corner = points[activeCorner];
    
    // Size of magnifier is 120x120, zoom is 2.5x
    const zoom = 2.5;
    const magSize = 120;
    
    const s = getScreenCoords(corner);
    
    // We want the magnifier to center on the active corner coordinate s.x, s.y
    const imgLeft = magSize / 2 - (s.x - layout.offsetX) * zoom;
    const imgTop = magSize / 2 - (s.y - layout.offsetY) * zoom;

    // Magnifier container style: Position it floating above the finger
    const floatLeft = Math.max(10, Math.min(SCREEN_W - magSize - 10, dragPosition.x - magSize / 2));
    const floatTop = Math.max(10, dragPosition.y - magSize - 40); // 40px above finger

    return {
      imgLeft,
      imgTop,
      floatLeft,
      floatTop,
      imgW: layout.fitW * zoom,
      imgH: layout.fitH * zoom,
    };
  }, [activeCorner, points, layout, dragPosition]);

  return (
    <View style={[styles.root, { backgroundColor: '#121212' }]}>
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Adjust Boundaries</Text>
        <Text style={styles.subtitle}>Drag corners to align perfectly with the paper edges</Text>
      </View>

      {/* Main Canvas Viewport */}
      <View
        style={styles.canvasContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setContainerSize({ width, height });
        }}
        {...panResponder.panHandlers}
      >
        {layout && containerSize && (
          <View style={styles.innerCanvas}>
            {/* Base Image */}
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.canvasImage,
                {
                  width: layout.fitW,
                  height: layout.fitH,
                  left: layout.offsetX,
                  top: layout.offsetY,
                },
              ]}
              resizeMode="contain"
            />

            {/* Svg Quad Border Overlay */}
            <Svg style={StyleSheet.absoluteFill}>
              {/* Highlight area */}
              <Polygon
                points={polyPointsString}
                fill="rgba(0, 191, 165, 0.25)"
                stroke={theme.primary}
                strokeWidth="2.5"
              />
              {/* Corner helper lines */}
              <Line
                x1={screenPoints[0].x}
                y1={screenPoints[0].y}
                x2={screenPoints[2].x}
                y2={screenPoints[2].y}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <Line
                x1={screenPoints[1].x}
                y1={screenPoints[1].y}
                x2={screenPoints[3].x}
                y2={screenPoints[3].y}
                stroke="rgba(255, 255, 255, 0.15)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            </Svg>

            {/* Draggable Circle Corner Knobs */}
            {screenPoints.map((pt, idx) => (
              <View
                key={idx}
                style={[
                  styles.handleCircleOuter,
                  {
                    left: pt.x - 22,
                    top: pt.y - 22,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <View style={[styles.handleCircleInner, { backgroundColor: theme.primary }]} />
              </View>
            ))}

            {/* Magnifying Glass Zoom Lens */}
            {magnifierOffset && (
              <View
                style={[
                  styles.magnifierContainer,
                  {
                    left: magnifierOffset.floatLeft,
                    top: magnifierOffset.floatTop,
                    borderColor: theme.primary,
                  },
                  Shadows.lg,
                ]}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: magnifierOffset.imgW,
                    height: magnifierOffset.imgH,
                    position: 'absolute',
                    left: magnifierOffset.imgLeft,
                    top: magnifierOffset.imgTop,
                  }}
                  resizeMode="stretch"
                />
                {/* Crosshair target in magnifier */}
                <View style={[styles.crosshairVertical, { backgroundColor: theme.primary }]} />
                <View style={[styles.crosshairHorizontal, { backgroundColor: theme.primary }]} />
              </View>
            )}
          </View>
        )}
      </View>

      {/* Button Row CTA */}
      <View style={styles.footer}>
        <OutlineButton
          label="Cancel"
          onPress={onCancel}
          style={styles.btn}
        />
        <PrimaryButton
          label="Apply Crop"
          onPress={() => onSave(points)}
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.md,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10.5,
    textAlign: 'center',
    fontWeight: '500',
  },
  canvasContainer: {
    flex: 1,
    marginVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    backgroundColor: '#0F0F0F',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
    position: 'relative',
  },
  innerCanvas: {
    flex: 1,
    position: 'relative',
  },
  canvasImage: {
    position: 'absolute',
    opacity: 0.85,
  },
  handleCircleOuter: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  handleCircleInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  magnifierContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    backgroundColor: '#000000',
    overflow: 'hidden',
    zIndex: 999,
  },
  crosshairVertical: {
    position: 'absolute',
    left: 59,
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.7,
  },
  crosshairHorizontal: {
    position: 'absolute',
    top: 59,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  btn: {
    flex: 1,
  },
});
