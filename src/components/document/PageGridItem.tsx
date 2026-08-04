import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { PageGridItemProps } from '@/types/types';
import Icon from '../shared/Icon';

export const PageGridItem: React.FC<PageGridItemProps> = ({
  page,
  index = 0,
  pageNum,
  totalCount = 1,
  onSelect,
  onPress,
  onDelete,
  onRotate,
}) => {
  const theme = useTheme();
  const handlePress = onSelect || onPress;
  const pageDisplayIndex = pageNum !== undefined ? pageNum : index + 1;
  const imageUri = page.thumbnailUri || page.croppedUri || page.originalUri;
  const pageRotation = page.rotation || 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.imageWrapper}>
        <Image
          source={{ uri: imageUri }}
          style={[styles.thumbnail, { transform: [{ rotate: `${pageRotation}deg` }] }]}
          resizeMode="cover"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {pageDisplayIndex} / {totalCount}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn} onPress={onRotate} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Icon sf="arrow.triangle.2.circlepath" fallback="↻" size={16} color={theme.text} />
        </TouchableOpacity>
        {totalCount > 1 && (
          <TouchableOpacity style={styles.actionBtn} onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon sf="trash" fallback="🗑" size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 0.75,
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
  actionBtn: {
    padding: 4,
  },
});
