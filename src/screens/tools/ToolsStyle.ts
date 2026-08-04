import { StyleSheet } from 'react-native';
import { Radius, Spacing, Typography } from '@/theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.lg + 2,
    fontWeight: '900',
  },
  mainScroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  toolsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  toolCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toolIconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTextWrap: {
    flex: 1,
    gap: 2,
  },
  toolTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  toolTitle: {
    fontSize: Typography.sizes.sm + 1,
    fontWeight: '800',
  },
  badgeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  toolDesc: {
    fontSize: Typography.sizes.xs,
    lineHeight: 18,
  },
});
