import { useTheme } from '@/hooks/useTheme';
import { Radius, Shadows, Spacing, Typography } from '@/theme';
import { Point } from '@/types/types';
import { useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Line, Polygon } from 'react-native-svg';
import { OutlineButton } from './OutlineButton';
import { PrimaryButton } from './PrimaryButton';

const { width: SCREEN_W } = Dimensions.get('window');

export interface DocumentCropViewProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  initialPoints?: Point[];
  onCropChange?: (points: Point[]) => void;
  onCancel?: () => void;
  onSave?: (points: Point[]) => void;
}

const DEFAULT_POINTS: Point[] = [
  { x: 0.15, y: 0.15 },
  { x: 0.85, y: 0.15 },
  { x: 0.85, y: 0.85 },
  { x: 0.15, y: 0.85 },
];

export function DocumentCropView({
  imageUri,
  imageWidth,
  imageHeight,
  initialPoints,
  onCropChange,
  onCancel,
  onSave,
}: DocumentCropViewProps) {
  const theme = useTheme();

  const [points, setPoints] = useState<Point[]>(() => {
    if (Array.isArray(initialPoints) && initialPoints.length === 4) {
      return initialPoints;
    }
    return DEFAULT_POINTS;
  });

  const pointsRef = useRef<Point[]>(points);
  pointsRef.current = points;

  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);
  const containerRef = useRef<View>(null);
  const containerPagePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [activeCorner, setActiveCorner] = useState<number>(-1);
  const activeCornerRef = useRef<number>(-1);
  activeCornerRef.current = activeCorner;

  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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
      fitW = winW;
      fitH = winW / ratioImg;
      offsetY = (winH - fitH) / 2;
    } else {
      fitH = winH;
      fitW = winH * ratioImg;
      offsetX = (winW - fitW) / 2;
    }

    return { fitW, fitH, offsetX, offsetY };
  }, [containerSize, imageWidth, imageHeight]);

  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const getContainerRelativeCoords = (pageX: number, pageY: number) => {
    const pos = containerPagePos.current;
    return {
      x: pageX - pos.x,
      y: pageY - pos.y,
    };
  };

  const getScreenCoords = (p: Point) => {
    if (!layout) return { x: 0, y: 0 };
    return {
      x: layout.offsetX + p.x * layout.fitW,
      y: layout.offsetY + p.y * layout.fitH,
    };
  };

  const getNormalizedCoords = (x: number, y: number) => {
    const l = layoutRef.current;
    if (!l) return { x: 0, y: 0 };
    const nX = Math.max(0, Math.min(1, (x - l.offsetX) / l.fitW));
    const nY = Math.max(0, Math.min(1, (y - l.offsetY) / l.fitH));
    return { x: nX, y: nY };
  };

  const handleTouchStart = (pageX: number, pageY: number) => {
    const l = layoutRef.current;
    if (!l) return;

    const rel = getContainerRelativeCoords(pageX, pageY);

    let closestIndex = -1;
    let minDistance = 70;

    pointsRef.current.forEach((p, idx) => {
      const s = {
        x: l.offsetX + p.x * l.fitW,
        y: l.offsetY + p.y * l.fitH,
      };
      const dist = Math.hypot(rel.x - s.x, rel.y - s.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    if (closestIndex !== -1) {
      setActiveCorner(closestIndex);
      activeCornerRef.current = closestIndex;
      setDragPosition({ x: rel.x, y: rel.y });
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { pageX, pageY } = evt.nativeEvent;
        handleTouchStart(pageX, pageY);
      },
      onPanResponderMove: (evt) => {
        const curActive = activeCornerRef.current;
        if (curActive === -1 || !layoutRef.current) return;

        const { pageX, pageY } = evt.nativeEvent;
        const rel = getContainerRelativeCoords(pageX, pageY);

        setDragPosition({ x: rel.x, y: rel.y });
        const norm = getNormalizedCoords(rel.x, rel.y);

        const updated = [...pointsRef.current];
        updated[curActive] = norm;
        setPoints(updated);
      },
      onPanResponderRelease: () => {
        setActiveCorner(-1);
        activeCornerRef.current = -1;
      },
      onPanResponderTerminate: () => {
        setActiveCorner(-1);
        activeCornerRef.current = -1;
      },
    })
  ).current;

  const screenPoints = useMemo(() => {
    return points.map((p) => getScreenCoords(p));
  }, [points, layout]);

  const polyPointsString = useMemo(() => {
    if (!layout) return '';
    return screenPoints
      .map((s) => `${s.x},${s.y}`)
      .join(' ');
  }, [screenPoints, layout]);

  const magnifierOffset = useMemo(() => {
    if (activeCorner === -1 || !layout) return null;
    const corner = points[activeCorner];

    const zoom = 2.5;
    const magSize = 120;

    const s = getScreenCoords(corner);

    const imgLeft = magSize / 2 - (s.x - layout.offsetX) * zoom;
    const imgTop = magSize / 2 - (s.y - layout.offsetY) * zoom;

    const floatLeft = Math.max(10, Math.min(SCREEN_W - magSize - 10, dragPosition.x - magSize / 2));
    const floatTop = Math.max(10, dragPosition.y - magSize - 40);

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
      <View style={styles.header}>
        <Text style={styles.title}>Adjust Boundaries</Text>
        <Text style={styles.subtitle}>Drag corners to align perfectly with the paper edges</Text>
      </View>

      <View
        ref={containerRef}
        style={styles.canvasContainer}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setContainerSize({ width, height });
          containerRef.current?.measureInWindow((x, y) => {
            if (x || y) {
              containerPagePos.current = { x, y };
            }
          });
        }}
        {...panResponder.panHandlers}
      >
        {layout && containerSize && (
          <View style={styles.innerCanvas} pointerEvents="box-none">
            <View
              pointerEvents="none"
              style={[
                styles.canvasImage,
                {
                  width: layout.fitW,
                  height: layout.fitH,
                  left: layout.offsetX,
                  top: layout.offsetY,
                },
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            </View>

            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
              <Polygon
                points={polyPointsString}
                fill="rgba(0, 191, 165, 0.25)"
                stroke={theme.primary}
                strokeWidth="2.5"
              />
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

            {screenPoints.map((pt, idx) => (
              <View
                key={idx}
                pointerEvents="none"
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
                pointerEvents="none"
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
                <View style={[styles.crosshairVertical, { backgroundColor: theme.primary }]} />
                <View style={[styles.crosshairHorizontal, { backgroundColor: theme.primary }]} />
              </View>
            )}
          </View>
        )}
      </View>

      {(onCancel || onSave) && (
        <View style={styles.footer}>
          {onCancel && (
            <OutlineButton
              label="Cancel"
              onPress={onCancel}
              style={styles.btn}
            />
          )}
          {onSave && (
            <PrimaryButton
              label="Apply Crop"
              onPress={() => onSave(points)}
              style={styles.btn}
            />
          )}
        </View>
      )}
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

