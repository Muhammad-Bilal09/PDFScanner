import { useTheme } from "@/hooks/useTheme";
import { Radius, Shadows, Spacing, Typography } from "@/theme";
import { DocumentCardsProps } from "@/types/types";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Icon } from "./Icon";


export function DocumentCard({
  item,
  viewMode = 'list',
  onPress,
  onMenuPress,
}: DocumentCardsProps) {
  const theme = useTheme();

  const docTitle = item.name || item.title || "Untitled Document";
  const pagesCount = Array.isArray(item.pages) ? item.pages.length : (item.pages || (item.pagesList ? item.pagesList.length : 1));
  const docSize = item.size || item.pdfSizeFormatted || "PDF";
  const docDate = item.date || (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "");

  const thumbUri = item.pagesList && item.pagesList.length > 0
    ? (item.pagesList[0].thumbnailUri || item.pagesList[0].croppedUri || item.pagesList[0].originalUri)
    : (Array.isArray(item.pages) && item.pages.length > 0 ? item.pages[0].croppedUri || item.pages[0].originalUri : null);

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
      <View
        style={[
          styles.thumbnail,
          { backgroundColor: item.thumbColor || theme.primaryLight },
        ]}
      >
        {thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
            style={styles.thumbnailImg}
            contentFit="cover"
          />
        ) : (
          <View style={styles.docSimulator}>
            <View
              style={[styles.docLine, { backgroundColor: theme.primary }]}
            />
            <View
              style={[
                styles.docLine,
                { width: "80%", backgroundColor: theme.primary },
              ]}
            />
            <View
              style={[
                styles.docLine,
                { width: "60%", backgroundColor: theme.primary },
              ]}
            />
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {docTitle}
        </Text>
        <Text style={[styles.metadata, { color: theme.textSecondary }]}>
          {docDate ? `${docDate} · ` : ""}{docSize} · {pagesCount}{" "}
          {pagesCount === 1 ? "Page" : "Pages"}
        </Text>
      </View>

      <Pressable
        onPress={onMenuPress}
        hitSlop={12}
        style={styles.menuBtn}
        accessibilityLabel="Document actions"
      >
        <Icon
          sf="ellipsis.vertical"
          fallback="⋮"
          size={16}
          color={theme.textSecondary}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  docSimulator: {
    width: "60%",
    gap: Spacing.xxs,
  },
  docLine: {
    height: 2.5,
    borderRadius: Radius.xs,
    width: "100%",
  },
  details: {
    flex: 1,
    justifyContent: "center",
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
    width: "100%",
    height: "100%",
    borderRadius: Radius.sm,
  },
});

export default DocumentCard;
