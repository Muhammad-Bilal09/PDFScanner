import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { pickPhotoWithPermissions } from "@/utils/photo-picker";

import { BottomSheet } from "@/components/shared/BottomSheet";
import {
  DocumentCard,
  DocumentItemType,
} from "@/components/shared/DocumentCard";
import { Icon } from "@/components/shared/Icon";
import { TabBar } from "@/components/tabBar";
import { useDocuments } from "@/hooks/use-documents";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Shadows, Spacing, Typography } from "@/theme";

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  const {
    documents,
    loading,
    deleteDocument,
    renameDocument,
    toggleFavorite,
    refresh,
  } = useDocuments();

  const [selectedDoc, setSelectedDoc] = useState<DocumentItemType | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  // Compute storage usage statistics dynamically
  const storageStats = React.useMemo(() => {
    let totalSizeB = 0;
    let favoritesCount = 0;

    documents.forEach((doc) => {
      if (doc.favorite) favoritesCount++;
      const sizeStr = doc.size || "0 KB";
      const val = parseFloat(sizeStr);
      if (sizeStr.includes("MB")) {
        totalSizeB += val * 1024 * 1024;
      } else if (sizeStr.includes("KB")) {
        totalSizeB += val * 1024;
      } else {
        totalSizeB += val;
      }
    });

    const localMb = (totalSizeB / (1024 * 1024)).toFixed(1);
    return {
      localSize: `${localMb} MB`,
      favoritesCount,
      totalCount: documents.length,
    };
  }, [documents]);

  const handleDocumentPress = (id: string) => {
    router.push({ pathname: "/documentEdit" as any, params: { id } });
  };

  const handleMenuPress = (doc: DocumentItemType) => {
    setSelectedDoc(doc);
    setRenameText(doc.name);
    setShowMenu(true);
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    Alert.alert(
      "Delete Document",
      `Are you sure you want to delete ${selectedDoc.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDocument(selectedDoc.id);
              setShowMenu(false);
            } catch (e) {
              Alert.alert("Error", "Failed to delete document");
            }
          },
        },
      ],
    );
  };

  const handleRenameSave = async () => {
    if (!selectedDoc || !renameText.trim()) return;
    try {
      await renameDocument(selectedDoc.id, renameText.trim());
      setShowRenameModal(false);
      setShowMenu(false);
    } catch (e) {
      Alert.alert("Error", "Failed to rename document");
    }
  };

  const handleToggleFavorite = async () => {
    if (!selectedDoc) return;
    try {
      await toggleFavorite(selectedDoc.id);
      setShowMenu(false);
      Alert.alert(
        "Success",
        selectedDoc.favorite ? "Removed from favorites" : "Added to favorites",
      );
    } catch (e) {
      Alert.alert("Error", "Failed to update favorite status");
    }
  };

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

  // Sorted documents (most recent scan/import strictly at the top)
  const sortedDocs = React.useMemo(() => {
    return [...documents].sort((a, b) => {
      const timeA = a.createdAt || (a.id.startsWith('doc_') ? parseInt(a.id.split('_')[1], 10) || 0 : 0);
      const timeB = b.createdAt || (b.id.startsWith('doc_') ? parseInt(b.id.split('_')[1], 10) || 0 : 0);
      if (timeA !== timeB) {
        return timeB - timeA;
      }
      return documents.indexOf(a) - documents.indexOf(b);
    });
  }, [documents]);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView
        style={{ backgroundColor: theme.background }}
        edges={["top"]}
      />

      {/* Premium Dashboard Header Row */}
      <View style={styles.dashboardHeader}>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Icon
              sf="doc.text.fill"
              fallback="📄"
              size={22}
              color={theme.primary}
            />
            <Text style={[styles.profileName, { color: theme.text }]}>
              DocScan
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScroll}
      >
        {/* Quick Launch scan buttons */}
        <View style={styles.quickLaunchRow}>
          <Pressable
            style={[
              styles.quickLaunchCard,
              { backgroundColor: theme.primary, borderColor: theme.primary },
              Shadows.md,
            ]}
            onPress={() => router.push("/scan" as any)}
          >
            <View
              style={[
                styles.quickLaunchCircle,
                { backgroundColor: "rgba(255,255,255,0.18)" },
              ]}
            >
              <Icon sf="camera.fill" fallback="📷" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.quickLaunchText}>
              <Text style={styles.quickLaunchTitle}>Quick Scan</Text>
              <Text style={[styles.quickLaunchDesc, { color: "#FFFFFF" }]}>
                Capture paper docs
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.quickLaunchCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.sm,
            ]}
            onPress={handleImportGallery}
          >
            <View
              style={[
                styles.quickLaunchCircle,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Icon sf="photo" fallback="🖼" size={20} color={theme.primary} />
            </View>
            <View style={styles.quickLaunchText}>
              <Text style={[styles.quickLaunchTitle, { color: theme.text }]}>
                Import Photos
              </Text>
              <Text
                style={[styles.quickLaunchDesc, { color: theme.textSecondary }]}
              >
                Convert existing files
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Recent scanned items */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            Recent Documents
          </Text>
        </View>

        {sortedDocs.length === 0 ? (
          <View
            style={[
              styles.emptyRecentCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Icon
              sf="doc.text"
              fallback="📄"
              size={32}
              color={theme.textSecondary}
            />
            <Text
              style={[styles.emptyRecentText, { color: theme.textSecondary }]}
            >
              No documents yet. Tap Quick Scan to begin.
            </Text>
          </View>
        ) : (
          <View style={styles.docsListWrap}>
            {sortedDocs.map((item) => (
              <View key={item.id} style={styles.cardItemWrapper}>
                <DocumentCard
                  item={item}
                  onPress={() => handleDocumentPress(item.id)}
                  onMenuPress={() => handleMenuPress(item)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Quick Tools Panel */}
        {/* <Text
          style={[
            styles.sectionHeading,
            {
              color: theme.text,
              marginTop: "auto",
              justifyContent: "flex-end",
            },
          ]}
        >
          Quick Tools
        </Text>
        <View
          style={[
            styles.toolsGrid,
            { backgroundColor: theme.surface, borderColor: theme.border },
            Shadows.sm,
          ]}
        >
          <Pressable
            style={styles.toolGridItem}
            onPress={() => router.replace("/tools" as any)}
          >
            <Icon
              sf="wand.and.stars"
              fallback="🪄"
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.toolItemText, { color: theme.text }]}>
              Document Tools
            </Text>
          </Pressable>
          <View
            style={[styles.toolDivider, { backgroundColor: theme.border }]}
          />
          <Pressable
            style={styles.toolGridItem}
            onPress={() => router.replace("/tools" as any)}
          >
            <Icon
              sf="square.and.arrow.up"
              fallback="↗"
              size={20}
              color={theme.primary}
            />
            <Text style={[styles.toolItemText, { color: theme.text }]}>
              Share / Compile PDF
            </Text>
          </Pressable>
        </View> */}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Options Context BottomSheet */}
      <BottomSheet
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        title={selectedDoc?.name || "Document Options"}
      >
        <View style={styles.menuContainer}>
          <Pressable
            style={styles.menuItem}
            onPress={() => setShowRenameModal(true)}
          >
            <Icon sf="pencil" fallback="✏️" size={18} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              Rename
            </Text>
          </Pressable>
          <View
            style={[styles.menuDivider, { backgroundColor: theme.border }]}
          />

          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              router.push({
                pathname: "/exportShare" as any,
                params: { id: selectedDoc?.id },
              });
            }}
          >
            <Icon
              sf="square.and.arrow.up"
              fallback="↗"
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              Share / Export PDF
            </Text>
          </Pressable>
          <View
            style={[styles.menuDivider, { backgroundColor: theme.border }]}
          />
          <Pressable style={styles.menuItem} onPress={handleToggleFavorite}>
            <Icon
              sf={selectedDoc?.favorite ? "heart.slash.fill" : "heart.fill"}
              fallback="❤"
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              {selectedDoc?.favorite ? "Remove Favorite" : "Mark Favorite"}
            </Text>
          </Pressable>
          <View
            style={[styles.menuDivider, { backgroundColor: theme.border }]}
          />
          <Pressable style={styles.menuItem} onPress={handleDelete}>
            <Icon sf="trash" fallback="🗑" size={18} color={theme.error} />
            <Text style={[styles.menuItemText, { color: theme.error }]}>
              Delete
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Rename Dialog */}
      <BottomSheet
        visible={showRenameModal}
        onClose={() => setShowRenameModal(false)}
        title="Rename Document"
      >
        <View style={styles.renameContainer}>
          <TextInput
            style={[
              styles.renameInput,
              {
                color: theme.text,
                borderColor: theme.border,
                backgroundColor: theme.background,
              },
            ]}
            value={renameText}
            onChangeText={setRenameText}
            autoFocus
            selectTextOnFocus
          />
          <View style={styles.renameActions}>
            <Pressable
              style={[
                styles.renameBtn,
                { borderColor: theme.border, borderWidth: 1 },
              ]}
              onPress={() => setShowRenameModal(false)}
            >
              <Text style={{ color: theme.textSecondary }}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.renameBtn, { backgroundColor: theme.primary }]}
              onPress={handleRenameSave}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Tab bar */}
      <TabBar activeTab="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dashboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerInfo: {
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  profileName: {
    fontSize: Typography.sizes.lg + 2,
    fontWeight: "900",
  },
  mainScroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  statsWidgetCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statsCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statBoxItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: Typography.sizes.md,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  statBoxDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  quickLaunchRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickLaunchCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  quickLaunchCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLaunchText: {
    flex: 1,
    gap: 2,
  },
  quickLaunchTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  quickLaunchDesc: {
    fontSize: 9,
    opacity: 0.8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: "800",
  },
  viewAllBtnText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
  },
  emptyRecentCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  emptyRecentText: {
    fontSize: Typography.sizes.xs,
    textAlign: "center",
  },
  docsListWrap: {
    gap: Spacing.sm,
  },
  cardItemWrapper: {
    width: "100%",
  },
  toolsGrid: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  toolGridItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  toolItemText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
  },
  toolDivider: {
    height: StyleSheet.hairlineWidth,
  },
  menuContainer: {
    paddingBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  menuItemText: {
    fontSize: Typography.sizes.sm,
    fontWeight: "700",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
  },
  renameContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  renameInput: {
    height: 48,
    borderRadius: Radius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.sizes.sm,
    fontWeight: "600",
  },
  renameActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.sm,
  },
  renameBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
