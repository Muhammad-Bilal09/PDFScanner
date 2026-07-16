import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

import { TabBar } from '@/components/tabBar';
import { useDocuments } from '@/hooks/use-documents';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius, Typography, Shadows } from '@/theme';
import { Header } from '@/components/shared/Header';
import { SearchBar } from '@/components/shared/SearchBar';
import { EmptyView } from '@/components/shared/EmptyView';
import { LoadingView } from '@/components/shared/LoadingView';
import { DocumentCard, DocumentItemType } from '@/components/shared/DocumentCard';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { Icon } from '@/components/shared/Icon';
import { CloudSyncManager } from '@/services/cloud-sync';

const { width: SCREEN_W } = Dimensions.get('window');

const CATEGORIES = ['All Docs', 'Favorites', 'Recent', 'Invoices', 'Personal', 'Business'];

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  
  const {
    documents,
    loading,
    deleteDocument,
    renameDocument,
    updateDocument,
    toggleFavorite,
    refresh
  } = useDocuments();

  const [selectedCategory, setSelectedCategory] = useState('All Docs');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItemType | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [sortOption, setSortOption] = useState<'date' | 'name'>('date');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Load documents and process sync queue on focus
  useEffect(() => {
    refresh();
    CloudSyncManager.processQueue();
  }, []);

  // Compute storage usage statistics dynamically
  const storageStats = React.useMemo(() => {
    let totalSizeB = 0;
    let favoritesCount = 0;

    documents.forEach((doc) => {
      if (doc.favorite) favoritesCount++;
      const sizeStr = doc.size || '0 KB';
      const val = parseFloat(sizeStr);
      if (sizeStr.includes('MB')) {
        totalSizeB += val * 1024 * 1024;
      } else if (sizeStr.includes('KB')) {
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
    router.push({ pathname: '/documentEdit' as any, params: { id } });
  };

  const handleMenuPress = (doc: DocumentItemType) => {
    setSelectedDoc(doc);
    setRenameText(doc.name);
    setShowMenu(true);
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${selectedDoc.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(selectedDoc.id);
              setShowMenu(false);
            } catch (e) {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const handleRenameSave = async () => {
    if (!selectedDoc || !renameText.trim()) return;
    try {
      await renameDocument(selectedDoc.id, renameText.trim());
      setShowRenameModal(false);
      setShowMenu(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to rename document');
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = async () => {
    if (!selectedDoc) return;
    try {
      await toggleFavorite(selectedDoc.id);
      setShowMenu(false);
      Alert.alert('Success', selectedDoc.favorite ? 'Removed from favorites' : 'Added to favorites');
    } catch (e) {
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  // Launch gallery select directly from dashboard
  const handleImportGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Forward image selection directly to crop scanner screen
        router.push({
          pathname: '/scan' as any,
          params: {
            importUri: asset.uri,
            width: asset.width || 800,
            height: asset.height || 1000,
          },
        });
      }
    } catch (e) {
      Alert.alert('Import Error', 'Failed to load photo library.');
    }
  };

  // Redefined Search (documents, tags, and page OCR contents)
  const filteredDocs = documents
    .filter((doc) => {
      // Category filter
      if (selectedCategory === 'Favorites') return doc.favorite === true;
      if (selectedCategory === 'Recent') {
        return doc.date.includes('Today') || doc.date.includes('mins ago') || doc.date.includes('hour');
      }
      if (selectedCategory !== 'All Docs') {
        return doc.tags?.some((t) => t.toLowerCase() === selectedCategory.toLowerCase());
      }
      return true;
    })
    .filter((doc) => {
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      // Match name
      const nameMatch = doc.name.toLowerCase().includes(query);
      
      // Match tags
      const tagMatch = doc.tags?.some((t) => t.toLowerCase().includes(query));

      // Match page OCR texts
      const ocrMatch = doc.pagesList?.some((page) =>
        page.ocrText?.toLowerCase().includes(query)
      );

      return nameMatch || tagMatch || ocrMatch;
    })
    .sort((a, b) => {
      if (sortOption === 'name') {
        return a.name.localeCompare(b.name);
      }
      // Sort by date ID
      return b.id.localeCompare(a.id);
    });

  const renderItem = useCallback(
    ({ item }: { item: DocumentItemType }) => (
      <DocumentCard
        item={item}
        onPress={() => handleDocumentPress(item.id)}
        onMenuPress={() => handleMenuPress(item)}
      />
    ),
    [documents]
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      {/* Premium Dashboard Header Row */}
      <View style={styles.dashboardHeader}>
        <View style={styles.headerInfo}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome Back</Text>
          <View style={styles.nameRow}>
            <Text style={[styles.profileName, { color: theme.text }]}>Alex Jenkins</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActionsRow}>
          <Pressable
            style={[styles.headerActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Icon sf={showSearch ? 'xmark' : 'magnifyingglass'} fallback="🔍" size={16} color={theme.text} />
          </Pressable>
          <Pressable
            style={[styles.headerActionBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
            onPress={() => setShowSortMenu(true)}
          >
            <Icon sf="line.3.horizontal.decrease" fallback="⇩" size={16} color={theme.text} />
          </Pressable>
        </View>
      </View>

      {/* Interactive Search Field */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      )}

      {/* Scrollable Dashboard Summary & Stats Widgets */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.mainScroll}>
        
        {/* Cloud backup quota widget */}
        <View style={[styles.statsWidgetCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}>
          <View style={styles.statsCardTop}>
            <View style={styles.statBoxItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{storageStats.totalCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total Scans</Text>
            </View>
            <View style={styles.statBoxDivider} />
            <View style={styles.statBoxItem}>
              <Text style={[styles.statValue, { color: theme.orange }]}>{storageStats.favoritesCount}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Favorites</Text>
            </View>
            <View style={styles.statBoxDivider} />
            <View style={styles.statBoxItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{storageStats.localSize}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Local Storage</Text>
            </View>
          </View>
          <View style={[styles.statsDivider, { backgroundColor: theme.border }]} />
          <View style={styles.cloudBackupRow}>
            <View style={styles.cloudInfoWrap}>
              <Icon sf="cloud.fill" fallback="☁" size={16} color={theme.primary} />
              <Text style={[styles.cloudText, { color: theme.text }]}>Cloud Storage Quota</Text>
            </View>
            <Text style={[styles.cloudQuotaText, { color: theme.textSecondary }]}>12.4 GB / 50 GB</Text>
          </View>
          <View style={[styles.quotaProgressBar, { backgroundColor: theme.border }]}>
            <View style={[styles.quotaProgressFill, { backgroundColor: theme.primary, width: '24.8%' }]} />
          </View>
        </View>

        {/* Quick Launch scan buttons */}
        <View style={styles.quickLaunchRow}>
          <Pressable
            style={[styles.quickLaunchCard, { backgroundColor: theme.primary, borderColor: theme.primary }, Shadows.md]}
            onPress={() => router.push('/scan' as any)}
          >
            <View style={[styles.quickLaunchCircle, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Icon sf="camera.fill" fallback="📷" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.quickLaunchText}>
              <Text style={styles.quickLaunchTitle}>Quick Scan</Text>
              <Text style={styles.quickLaunchDesc}>Capture paper docs</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.quickLaunchCard, { backgroundColor: theme.surface, borderColor: theme.border }, Shadows.sm]}
            onPress={handleImportGallery}
          >
            <View style={[styles.quickLaunchCircle, { backgroundColor: theme.primaryLight }]}>
              <Icon sf="photo" fallback="🖼" size={20} color={theme.primary} />
            </View>
            <View style={styles.quickLaunchText}>
              <Text style={[styles.quickLaunchTitle, { color: theme.text }]}>Import Photos</Text>
              <Text style={[styles.quickLaunchDesc, { color: theme.textSecondary }]}>Convert existing files</Text>
            </View>
          </Pressable>
        </View>

        {/* Categories Menu pills */}
        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            {CATEGORIES.map((category) => {
              const isActive = category === selectedCategory;
              return (
                <Pressable
                  key={category}
                  style={[
                    styles.categoryPill,
                    { backgroundColor: isActive ? theme.primary : theme.primaryLight },
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text style={[styles.categoryText, { color: isActive ? '#FFFFFF' : theme.textSecondary }]}>
                    {category}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Scanned items lists */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>Scanned Documents</Text>

        {filteredDocs.length === 0 ? (
          <EmptyView
            icon="doc.text.fill"
            fallback="📄"
            title={searchQuery ? 'No Scans Match Query' : 'Library is Empty'}
            description={
              searchQuery
                ? 'Try editing the document name, tag, or checking page OCR texts.'
                : 'Tap Quick Scan to start turning your paper documents, books, or receipts into PDFs.'
            }
            actionLabel={searchQuery ? undefined : 'Scan Document'}
            onActionPress={() => router.push('/scan' as any)}
            style={{ marginTop: Spacing.md }}
          />
        ) : (
          <View style={styles.docsListWrap}>
            {filteredDocs.map((item) => (
              <View key={item.id} style={styles.cardItemWrapper}>
                {renderItem({ item })}
              </View>
            ))}
          </View>
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Options Context BottomSheet */}
      <BottomSheet
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        title={selectedDoc?.name || 'Document Options'}
      >
        <View style={styles.menuContainer}>
          <Pressable style={styles.menuItem} onPress={() => setShowRenameModal(true)}>
            <Icon sf="pencil" fallback="✏️" size={18} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Rename</Text>
          </Pressable>
          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              router.push({ pathname: '/ocrRecognition' as any, params: { id: selectedDoc?.id } });
            }}
          >
            <Icon sf="text.viewfinder" fallback="T" size={18} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Extract Text (OCR)</Text>
          </Pressable>
          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              router.push({ pathname: '/exportShare' as any, params: { id: selectedDoc?.id } });
            }}
          >
            <Icon sf="square.and.arrow.up" fallback="↗" size={18} color={theme.primary} />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Share / Export PDF</Text>
          </Pressable>
          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.menuItem} onPress={handleToggleFavorite}>
            <Icon
              sf={selectedDoc?.favorite ? 'heart.slash.fill' : 'heart.fill'}
              fallback="❤"
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              {selectedDoc?.favorite ? 'Remove Favorite' : 'Mark Favorite'}
            </Text>
          </Pressable>
          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
          <Pressable style={styles.menuItem} onPress={handleDelete}>
            <Icon sf="trash" fallback="🗑" size={18} color={theme.error} />
            <Text style={[styles.menuItemText, { color: theme.error }]}>Delete</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Sorting BottomSheet */}
      <BottomSheet visible={showSortMenu} onClose={() => setShowSortMenu(false)} title="Sort By">
        <View style={styles.menuContainer}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setSortOption('date');
              setShowSortMenu(false);
            }}
          >
            <Icon
              sf={sortOption === 'date' ? 'checkmark.circle.fill' : 'circle'}
              fallback={sortOption === 'date' ? '✓' : '○'}
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Date Added</Text>
          </Pressable>
          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setSortOption('name');
              setShowSortMenu(false);
            }}
          >
            <Icon
              sf={sortOption === 'name' ? 'checkmark.circle.fill' : 'circle'}
              fallback={sortOption === 'name' ? '✓' : '○'}
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>Document Name</Text>
          </Pressable>
        </View>
      </BottomSheet>

      {/* Rename Dialog */}
      <BottomSheet visible={showRenameModal} onClose={() => setShowRenameModal(false)} title="Rename Document">
        <View style={styles.renameContainer}>
          <TextInput
            style={[
              styles.renameInput,
              { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
            ]}
            value={renameText}
            onChangeText={setRenameText}
            autoFocus
            selectTextOnFocus
          />
          <View style={styles.renameActions}>
            <Pressable
              style={[styles.renameBtn, { borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => setShowRenameModal(false)}
            >
              <Text style={{ color: theme.textSecondary }}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.renameBtn, { backgroundColor: theme.primary }]} onPress={handleRenameSave}>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      {/* Tab bar */}
      <TabBar activeTab="library" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  headerInfo: {
    gap: 2,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  profileName: {
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
  },
  proBadge: {
    backgroundColor: '#F0A820',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1.5,
    borderRadius: Radius.xs,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  mainScroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  statsWidgetCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  statsCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBoxItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: Typography.sizes.md,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  statBoxDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  statsDivider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  cloudBackupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cloudInfoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  cloudText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '800',
  },
  cloudQuotaText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '500',
  },
  quotaProgressBar: {
    height: 6,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  quotaProgressFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  quickLaunchRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  quickLaunchCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  quickLaunchCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLaunchText: {
    gap: 2,
  },
  quickLaunchTitle: {
    color: '#FFFFFF',
    fontSize: Typography.sizes.sm,
    fontWeight: '900',
  },
  quickLaunchDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9.5,
    fontWeight: '500',
  },
  categoriesContainer: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  categoriesScroll: {
    gap: Spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  categoryText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    marginLeft: 2,
  },
  docsListWrap: {
    gap: Spacing.sm,
  },
  cardItemWrapper: {
    width: '100%',
  },
  menuContainer: {
    paddingVertical: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuItemText: {
    fontSize: Typography.sizes.md,
    fontWeight: '700',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
  },
  renameContainer: {
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  renameInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.sizes.md,
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  renameBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.xs,
    minWidth: 80,
    alignItems: 'center',
  },
});
