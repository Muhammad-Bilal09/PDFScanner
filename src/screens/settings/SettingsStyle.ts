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
  sectionHeading: {
    fontSize: Typography.sizes.xs,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingLeft: 2,
  },
  cardGroup: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  rowTextWrap: {
    flex: 1,
    gap: 1,
  },
  rowTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
  rowSubtitle: {
    fontSize: Typography.sizes.xs,
  },
  rowValue: {
    fontSize: Typography.sizes.xs,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  aboutCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  appLogoBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  appName: {
    fontSize: Typography.sizes.md,
    fontWeight: '900',
  },
  appVer: {
    fontSize: Typography.sizes.xs,
  },
});
