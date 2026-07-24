import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { pickPhotoWithPermissions } from "@/utils/photo-picker";
import { BottomSheet } from "@/components/shared/BottomSheet";
import { Icon } from "@/components/shared/Icon";
import { TabBar } from "@/components/tabBar";
import { useDocuments } from "@/hooks/use-documents";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Shadows, Spacing, Typography } from "@/theme";

export default function ToolsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const { documents, refresh } = useDocuments();
  const [showDocSelector, setShowDocSelector] = useState(false);
  const [selectorTarget, setSelectorTarget] = useState<"share" | null>(null);

  React.useEffect(() => {
    refresh();
  }, []);

  const handleImportGallery = async () => {
    const picked = await pickPhotoWithPermissions();
    if (picked) {
      router.push({
        pathname: "/scan" as any,
        params: {
          importUri: picked.uri,
          width: picked.width,
          height: picked.height,
        },
      });
    }
  };

  const handleToolPress = (tool: "scan" | "gallery" | "share") => {
    if (tool === "scan") {
      router.push("/scan" as any);
    } else if (tool === "gallery") {
      handleImportGallery();
    } else if (tool === "share") {
      if (documents.length === 0) {
        Alert.alert(
          "No Documents",
          "Please scan or import a document first to use this tool.",
        );
        return;
      }
      setSelectorTarget("share");
      setShowDocSelector(true);
    }
  };

  const handleSelectDocument = (docId: string) => {
    setShowDocSelector(false);
    if (selectorTarget === "share") {
      router.push({ pathname: "/exportShare" as any, params: { id: docId } });
    }
    setSelectorTarget(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView
        style={{ backgroundColor: theme.background }}
        edges={["top"]}
      />

      {/* Header Row */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Tools</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScroll}
      >
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Select a tool below to process your local documents.
        </Text>

        <View style={styles.toolsList}>
          {/* Card 1: Camera Scanner */}
          <Pressable
            style={[
              styles.toolCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.sm,
            ]}
            onPress={() => handleToolPress("scan")}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon
                sf="camera.fill"
                fallback="📷"
                size={24}
                color={theme.primary}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.toolTitle, { color: theme.text }]}>
                Camera Scanner
              </Text>
              <Text style={[styles.toolDesc, { color: theme.textSecondary }]}>
                Capture documents using the device camera with automatic edge
                detection.
              </Text>
            </View>
            <Icon
              sf="chevron.right"
              fallback="›"
              size={16}
              color={theme.textSecondary}
            />
          </Pressable>

          {/* Card 2: Import Photo */}
          <Pressable
            style={[
              styles.toolCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.sm,
            ]}
            onPress={() => handleToolPress("gallery")}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon
                sf="photo.on.rectangle"
                fallback="🖼"
                size={22}
                color={theme.primary}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.toolTitle, { color: theme.text }]}>
                Import Photos
              </Text>
              <Text style={[styles.toolDesc, { color: theme.textSecondary }]}>
                Convert existing images from your gallery into clean cropped PDF
                pages.
              </Text>
            </View>
            <Icon
              sf="chevron.right"
              fallback="›"
              size={16}
              color={theme.textSecondary}
            />
          </Pressable>

          {/* Card 3: Compile & Share */}
          <Pressable
            style={[
              styles.toolCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.sm,
            ]}
            onPress={() => handleToolPress("share")}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon
                sf="square.and.arrow.up"
                fallback="↗"
                size={22}
                color={theme.primary}
              />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.toolTitle, { color: theme.text }]}>
                Compile & Share PDF
              </Text>
              <Text style={[styles.toolDesc, { color: theme.textSecondary }]}>
                Apply adjustments, format pages (A4/Letter), and share compiled
                PDF documents.
              </Text>
            </View>
            <Icon
              sf="chevron.right"
              fallback="›"
              size={16}
              color={theme.textSecondary}
            />
          </Pressable>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Document Selector BottomSheet */}
      <BottomSheet
        visible={showDocSelector}
        onClose={() => setShowDocSelector(false)}
        title="Select Target Document"
      >
        <ScrollView
          style={styles.selectorScroll}
          showsVerticalScrollIndicator={false}
        >
          {documents.map((doc) => (
            <Pressable
              key={doc.id}
              style={[styles.selectorItem, { borderColor: theme.border }]}
              onPress={() => handleSelectDocument(doc.id)}
            >
              <Icon
                sf="doc.text.fill"
                fallback="📄"
                size={20}
                color={theme.primary}
              />
              <View style={styles.selectorItemTextWrap}>
                <Text
                  style={[styles.selectorItemName, { color: theme.text }]}
                  numberOfLines={1}
                >
                  {doc.name}
                </Text>
                <Text
                  style={[
                    styles.selectorItemDetails,
                    { color: theme.textSecondary },
                  ]}
                >
                  {doc.pages} Pages · {doc.size || "0 KB"}
                </Text>
              </View>
              <Icon
                sf="chevron.right"
                fallback="›"
                size={16}
                color={theme.textSecondary}
              />
            </Pressable>
          ))}
          <View style={{ height: 30 }} />
        </ScrollView>
      </BottomSheet>

      {/* Tab bar */}
      <TabBar activeTab="tools" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg + 2,
    fontWeight: "900",
  },
  mainScroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  toolsList: {
    gap: Spacing.md,
  },
  toolCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  toolTitle: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: "800",
  },
  toolDesc: {
    fontSize: Typography.sizes.xs - 0.5,
    lineHeight: 16,
  },
  selectorScroll: {
    maxHeight: 300,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  selectorItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  selectorItemTextWrap: {
    flex: 1,
    gap: 2,
  },
  selectorItemName: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
  },
  selectorItemDetails: {
    fontSize: Typography.sizes.xs - 1,
  },
});
