import { StyleSheet } from 'react-native';
import { Radius, Spacing, Typography } from '@/theme';

export const styles = StyleSheet.create({
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
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  profileName: {
    fontSize: Typography.sizes.lg + 2,
    fontWeight: '900',
  },
  mainScroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  quickLaunchRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  quickLaunchCard: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickLaunchCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLaunchText: {
    flex: 1,
    gap: 2,
  },
  quickLaunchTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  quickLaunchDesc: {
    fontSize: 9,
    opacity: 0.8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: '800',
  },
  emptyRecentCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  emptyRecentText: {
    fontSize: Typography.sizes.xs,
    textAlign: 'center',
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
