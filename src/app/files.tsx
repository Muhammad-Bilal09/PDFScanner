import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

import { BottomSheet } from "@/components/shared/BottomSheet";
import {
  DocumentCard,
  DocumentItemType,
} from "@/components/shared/DocumentCard";
import { EmptyView } from "@/components/shared/EmptyView";
import { Icon } from "@/components/shared/Icon";
import { SearchBar } from "@/components/shared/SearchBar";
import { TabBar } from "@/components/tabBar";
import { useDocuments } from "@/hooks/use-documents";
import { useTheme } from "@/hooks/use-theme";
import { Radius, Spacing, Typography } from "@/theme";

const CATEGORIES = [
  "All Docs",
  "Favorites",
  "Recent",
  "Invoices",
  "Personal",
  "Business",
];

export default function FilesScreen() {
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

  const [selectedCategory, setSelectedCategory] = useState("All Docs");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItemType | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [sortOption, setSortOption] = useState<"date" | "name">("date");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

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

  // Filter and Sort docs
  const filteredDocs = documents
    .filter((doc) => {
      if (selectedCategory === "Favorites") return doc.favorite === true;
      if (selectedCategory === "Recent") {
        return (
          doc.date.includes("Today") ||
          doc.date.includes("mins ago") ||
          doc.date.includes("hour")
        );
      }
      if (selectedCategory !== "All Docs") {
        return doc.tags?.some(
          (t) => t.toLowerCase() === selectedCategory.toLowerCase(),
        );
      }
      return true;
    })
    .filter((doc) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const nameMatch = doc.name.toLowerCase().includes(query);
      const tagMatch = doc.tags?.some((t) => t.toLowerCase().includes(query));

      return nameMatch || tagMatch;
    })
    .sort((a, b) => {
      if (sortOption === "name") {
        return a.name.localeCompare(b.name);
      }
      return b.id.localeCompare(a.id);
    });

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView
        style={{ backgroundColor: theme.background }}
        edges={["top"]}
      />

      {/* Header Row */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Files</Text>
        <View style={styles.headerActionsRow}>
          <Pressable
            style={[
              styles.headerActionBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Icon
              sf={showSearch ? "xmark" : "magnifyingglass"}
              fallback="🔍"
              size={16}
              color={theme.text}
            />
          </Pressable>
          <Pressable
            style={[
              styles.headerActionBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setShowSortMenu(true)}
          >
            <Icon
              sf="line.3.horizontal.decrease"
              fallback="⇩"
              size={16}
              color={theme.text}
            />
          </Pressable>
        </View>
      </View>

      {/* Search Input */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      )}

      {/* Category Pills */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((category) => {
            const isActive = category === selectedCategory;
            return (
              <Pressable
                key={category}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isActive
                      ? theme.primary
                      : theme.primaryLight,
                  },
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: isActive ? "#FFFFFF" : theme.textSecondary },
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* List of Documents */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScroll}
      >
        {filteredDocs.length === 0 ? (
          <EmptyView
            icon="doc.text.fill"
            fallback="📄"
            title={searchQuery ? "No Scans Match Query" : "Library is Empty"}
            description={
              searchQuery
                ? "Try editing the document name or tag to find your scan."
                : "Scanned files will appear here."
            }
            style={{ marginTop: Spacing.xl }}
          />
        ) : (
          <View style={styles.docsListWrap}>
            {filteredDocs.map((item) => (
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
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Options BottomSheet */}
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

      {/* Sorting BottomSheet */}
      <BottomSheet
        visible={showSortMenu}
        onClose={() => setShowSortMenu(false)}
        title="Sort By"
      >
        <View style={styles.menuContainer}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setSortOption("date");
              setShowSortMenu(false);
            }}
          >
            <Icon
              sf={sortOption === "date" ? "checkmark.circle.fill" : "circle"}
              fallback={sortOption === "date" ? "✓" : "○"}
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              Date Added
            </Text>
          </Pressable>
          <View
            style={[styles.menuDivider, { backgroundColor: theme.border }]}
          />
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setSortOption("name");
              setShowSortMenu(false);
            }}
          >
            <Icon
              sf={sortOption === "name" ? "checkmark.circle.fill" : "circle"}
              fallback={sortOption === "name" ? "✓" : "○"}
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              Document Name
            </Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Rename Modal */}
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
      <TabBar activeTab="files" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg + 2,
    fontWeight: "900",
  },
  headerActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  categoriesContainer: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  categoriesScroll: {
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  categoryText: {
    fontSize: Typography.sizes.xs,
    fontWeight: "700",
  },
  mainScroll: {
    paddingHorizontal: Spacing.md,
  },
  docsListWrap: {
    gap: Spacing.sm,
  },
  cardItemWrapper: {
    width: "100%",
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
