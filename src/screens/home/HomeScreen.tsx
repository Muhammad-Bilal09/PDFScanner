import { BottomSheet } from "@/components/shared/BottomSheet";
import { DocumentCard } from "@/components/shared/DocumentCard";
import { Icon } from "@/components/shared/Icon";
import { TabBar } from "@/components/tabBar";
import { Shadows } from "@/theme";
import { Image } from "expo-image";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { styles } from "./HomeStyle";
import { useHomeScreen } from "./useHomeScreen";

export function HomeScreen() {
  const {
    router,
    theme,
    storageStats,
    sortedDocs,
    selectedDoc,
    showMenu,
    setShowMenu,
    showRenameModal,
    setShowRenameModal,
    renameText,
    setRenameText,
    handleDocumentPress,
    handleMenuPress,
    handleDelete,
    handleRenameSave,
    handleToggleFavorite,
    handleImportGallery,
  } = useHomeScreen();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView
        style={{ backgroundColor: theme.background }}
        edges={["top"]}
      />

      <View style={styles.dashboardHeader}>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Image
              source={require('@/assets/images/expo-logo.png')}
              style={{ width: 28, height: 28, borderRadius: 7, marginRight: 8 }}
              contentFit="contain"
            />
            <Text style={[styles.profileName, { color: theme.text }]}>
              Scanly
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScroll}
      >
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
            {sortedDocs.map((item: any) => (
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

      <BottomSheet
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        title={
          selectedDoc?.title || (selectedDoc as any)?.name || "Document Options"
        }
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
              sf={
                (selectedDoc as any)?.favorite
                  ? "heart.slash.fill"
                  : "heart.fill"
              }
              fallback="❤"
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              {(selectedDoc as any)?.favorite
                ? "Remove Favorite"
                : "Mark Favorite"}
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

      <TabBar activeTab="home" />
    </View>
  );
}

export default HomeScreen;
