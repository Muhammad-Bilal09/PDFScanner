import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius, Typography, Shadows } from '@/theme';
import { Icon } from './Icon';

import { Point } from '@/services/processor';

export interface PageItemType {
  id: string;
  originalUri: string;
  processedUri: string;
  corners: Point[];
  filter: string;
  rotation: number; // 0, 90, 180, 270
  ocrText?: string;
  cloudinaryOriginalUrl?: string;
  cloudinaryProcessedUrl?: string;
}

export interface DocumentItemType {
  id: string;
  name: string;
  date: string;
  size: string;
  pages: number;
  thumbColor?: string;
  cloudinaryUrl?: string;
  pagesList: PageItemType[];
  tags?: string[];
  favorite?: boolean;
}

interface DocumentCardProps {
  item: DocumentItemType;
  onPress: () => void;
  onMenuPress: () => void;
}

export function DocumentCard({ item, onPress, onMenuPress }: DocumentCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        Shadows.sm,
      ]}
    >
      {/* Page Thumbnail */}
      <View style={[styles.thumbnail, { backgroundColor: item.thumbColor || theme.primaryLight }]}>
        {item.pagesList && item.pagesList.length > 0 ? (
          <Image
            source={{ uri: item.pagesList[0].processedUri }}
            style={styles.thumbnailImg}
            contentFit="cover"
          />
        ) : (
          <View style={styles.docSimulator}>
            <View style={[styles.docLine, { backgroundColor: theme.primary }]} />
            <View style={[styles.docLine, { width: '80%', backgroundColor: theme.primary }]} />
            <View style={[styles.docLine, { width: '60%', backgroundColor: theme.primary }]} />
          </View>
        )}
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.metadata, { color: theme.textSecondary }]}>
          {item.date}  ·  {item.size}  ·  {item.pages} {item.pages === 1 ? 'Page' : 'Pages'}
        </Text>
      </View>

      {/* Ellipsis/Options Button */}
      <Pressable
        onPress={onMenuPress}
        hitSlop={12}
        style={styles.menuBtn}
        accessibilityLabel="Document actions"
      >
        <Icon sf="ellipsis.vertical" fallback="⋮" size={16} color={theme.textSecondary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  docSimulator: {
    width: '60%',
    gap: Spacing.xxs,
  },
  docLine: {
    height: 2.5,
    borderRadius: Radius.xs,
    width: '100%',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  name: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold as any,
  },
  metadata: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium as any,
  },
  menuBtn: {
    padding: Spacing.xs,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.sm,
  },
});

export default DocumentCard;
