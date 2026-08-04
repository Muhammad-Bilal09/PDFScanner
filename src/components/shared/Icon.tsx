import { useTheme } from '@/hooks/useTheme';
import { IconProps } from '@/types/types';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const ICON_MAP: Record<
  string,
  { family: 'Ionicons' | 'MaterialCommunityIcons' | 'MaterialIcons'; name: string }
> = {
  'doc.text.fill': { family: 'Ionicons', name: 'document-text' },
  'doc.text': { family: 'Ionicons', name: 'document-text-outline' },
  'doc.on.doc': { family: 'Ionicons', name: 'copy-outline' },
  'trash': { family: 'Ionicons', name: 'trash-outline' },
  'trash.fill': { family: 'Ionicons', name: 'trash' },
  'arrow.clockwise': { family: 'Ionicons', name: 'refresh-outline' },
  'chevron.left': { family: 'Ionicons', name: 'chevron-back' },
  'chevron.right': { family: 'Ionicons', name: 'chevron-forward' },
  'chevron.down': { family: 'Ionicons', name: 'chevron-down' },
  'crop': { family: 'Ionicons', name: 'crop-outline' },
  'rotate.right': { family: 'MaterialCommunityIcons', name: 'rotate-right' },
  'plus': { family: 'Ionicons', name: 'add' },
  'text.viewfinder': { family: 'Ionicons', name: 'scan-outline' },
  'info.circle': { family: 'Ionicons', name: 'information-circle-outline' },
  'lock.fill': { family: 'Ionicons', name: 'lock-closed' },
  'lock.shield': { family: 'Ionicons', name: 'shield-checkmark-outline' },
  'cloud.fill': { family: 'Ionicons', name: 'cloud' },
  'link': { family: 'Ionicons', name: 'link-outline' },
  'camera.fill': { family: 'Ionicons', name: 'camera' },
  'square.and.arrow.up.fill': { family: 'Ionicons', name: 'share' },
  'square.and.arrow.up': { family: 'Ionicons', name: 'share-outline' },
  'printer.fill': { family: 'Ionicons', name: 'print' },
  'xmark': { family: 'Ionicons', name: 'close' },
  'magnifyingglass': { family: 'Ionicons', name: 'search' },
  'doc.text.magnifyingglass': { family: 'Ionicons', name: 'search-outline' },
  'line.3.horizontal.decrease': { family: 'Ionicons', name: 'filter-outline' },
  'heart.fill': { family: 'Ionicons', name: 'heart' },
  'heart.slash.fill': { family: 'Ionicons', name: 'heart-dislike' },
  'pencil': { family: 'Ionicons', name: 'pencil' },
  'checkmark.circle.fill': { family: 'Ionicons', name: 'checkmark-circle' },
  'circle': { family: 'Ionicons', name: 'ellipse-outline' },
  'play.fill': { family: 'Ionicons', name: 'play' },
  'chevron.up.chevron.down': { family: 'Ionicons', name: 'swap-vertical' },
  'xmark.circle.fill': { family: 'Ionicons', name: 'close-circle' },
  'slider.horizontal.3': { family: 'Ionicons', name: 'options-outline' },
  'arrow.triangle.2.circlepath': { family: 'Ionicons', name: 'sync-outline' },
  'checkmark': { family: 'Ionicons', name: 'checkmark' },
  'camera.shutter.button': { family: 'Ionicons', name: 'aperture-outline' },
  'bolt.fill': { family: 'Ionicons', name: 'flash' },
  'bolt.slash.fill': { family: 'Ionicons', name: 'flash-off' },
  'grid': { family: 'Ionicons', name: 'grid-outline' },
  'square.grid.2x2': { family: 'Ionicons', name: 'grid-outline' },
  'list.bullet': { family: 'Ionicons', name: 'list-outline' },
  'play.circle.fill': { family: 'Ionicons', name: 'play-circle' },
  'hand.tap.fill': { family: 'MaterialCommunityIcons', name: 'gesture-tap' },
  'photo': { family: 'Ionicons', name: 'image-outline' },
  'photo.on.rectangle': { family: 'Ionicons', name: 'images-outline' },
  'camera.aperture': { family: 'Ionicons', name: 'aperture' },
  'house.fill': { family: 'Ionicons', name: 'home' },
  'gearshape.fill': { family: 'Ionicons', name: 'settings' },
  'wand.and.stars': { family: 'Ionicons', name: 'color-wand-outline' },
  'moon.fill': { family: 'Ionicons', name: 'moon' },
  'internaldrive': { family: 'Ionicons', name: 'server-outline' },
  'arrow.right': { family: 'Ionicons', name: 'arrow-forward' },
  'arrow.left': { family: 'Ionicons', name: 'arrow-back' },
  'arrow.up.arrow.down': { family: 'Ionicons', name: 'swap-vertical' },
};

export function Icon({ sf, name, size = 20, color, style }: IconProps) {
  const theme = useTheme();
  const iconColor = color || theme.text;
  const key = sf || name || 'doc.text';
  const iconConfig = ICON_MAP[key] || {
    family: 'Ionicons',
    name: 'document-text-outline',
  };

  if (iconConfig.family === 'MaterialCommunityIcons') {
    return (
      <MaterialCommunityIcons
        name={iconConfig.name as any}
        size={size}
        color={iconColor}
        style={style}
      />
    );
  }

  if (iconConfig.family === 'MaterialIcons') {
    return (
      <MaterialIcons
        name={iconConfig.name as any}
        size={size}
        color={iconColor}
        style={style}
      />
    );
  }

  return (
    <Ionicons
      name={iconConfig.name as any}
      size={size}
      color={iconColor}
      style={style}
    />
  );
}

export default Icon;
