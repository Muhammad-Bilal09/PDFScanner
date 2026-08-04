import { StyleSheet } from 'react-native';
import { Radius, Spacing, Typography } from '@/theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg + 2,
    fontWeight: '900',
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
  categoriesContainer: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  categoriesScroll: {
    gap: Spacing.sm,
  },
  mainScroll: {
    paddingHorizontal: Spacing.md,
  },
  docsListWrap: {
    gap: Spacing.sm,
  },
  cardItemWrapper: {
    width: '100%',
  },
  menuContainer: {
    paddingBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  menuItemText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
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
    fontWeight: '600',
  },
  renameActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  renameBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
