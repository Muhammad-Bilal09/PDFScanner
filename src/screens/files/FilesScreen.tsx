import { FilterChip } from '@/components/common/FilterChip';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { DocumentCard } from '@/components/shared/DocumentCard';
import { EmptyView } from '@/components/shared/EmptyView';
import { Icon } from '@/components/shared/Icon';
import { SearchBar } from '@/components/shared/SearchBar';
import { TabBar } from '@/components/tabBar';
import { DocumentFilter } from '@/types/types';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './FilesStyle';
import { useFilesScreen } from './useFilesScreen';

export function FilesScreen() {
  const {
    router,
    theme,
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    viewMode,
    setViewMode,
    filteredDocuments,
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
  } = { ...useFilesScreen() };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ backgroundColor: theme.background }} edges={['top']} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>All Files</Text>

        <View style={styles.headerActionsRow}>
          <Pressable
            style={[
              styles.headerActionBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            <Icon
              sf={viewMode === 'list' ? 'square.grid.2x2' : 'list.bullet'}
              fallback={viewMode === 'list' ? '⊞' : '≡'}
              size={18}
              color={theme.text}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search by title or tag..."
        />
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {[
            { id: 'all', label: 'All Documents' },
            { id: 'scans', label: 'Scans' },
            { id: 'receipts', label: 'Receipts' },
            { id: 'cards', label: 'ID Cards' },
          ].map((cat) => {
            const isActive = selectedFilter === cat.id;
            return (
              <FilterChip
                key={cat.id}
                label={cat.label}
                active={isActive}
                onPress={() => setSelectedFilter(cat.id as DocumentFilter)}
              />
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.mainScroll}
        showsVerticalScrollIndicator={false}
      >
        {filteredDocuments.length === 0 ? (
          <EmptyView
            icon="doc.text.magnifyingglass"
            fallback="🔍"
            title="No Documents Found"
            description={
              searchQuery
                ? `No files match your query "${searchQuery}".`
                : 'Your document library is empty. Start by scanning a new document.'
            }
            actionLabel="Scan Document"
            onAction={() => router.push('/scan' as any)}
          />
        ) : (
          <View
            style={[
              styles.docsListWrap,
              viewMode === 'grid' && {
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
              },
            ]}
          >
            {filteredDocuments.map((item: any) => (
              <View
                key={item.id}
                style={[
                  styles.cardItemWrapper,
                  viewMode === 'grid' && { width: '48%' },
                ]}
              >
                <DocumentCard
                  item={item}
                  viewMode={viewMode}
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
        title={selectedDoc?.title || (selectedDoc as any)?.name || 'Document Options'}
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
          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

          <Pressable
            style={styles.menuItem}
            onPress={() => {
              setShowMenu(false);
              router.push({
                pathname: '/exportShare' as any,
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
          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

          <Pressable style={styles.menuItem} onPress={handleToggleFavorite}>
            <Icon
              sf={(selectedDoc as any)?.favorite ? 'heart.slash.fill' : 'heart.fill'}
              fallback="❤"
              size={18}
              color={theme.primary}
            />
            <Text style={[styles.menuItemText, { color: theme.text }]}>
              {(selectedDoc as any)?.favorite ? 'Remove Favorite' : 'Mark Favorite'}
            </Text>
          </Pressable>
          <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

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
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Save</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>

      <TabBar activeTab="files" />
    </View>
  );
}

export default FilesScreen;
