import { StyleSheet } from 'react-native';
import { Radius, Spacing, Typography } from '@/theme';

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  fileSummaryCard: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    alignItems: 'center',
  },
  summaryTextWrap: {
    flex: 1,
    marginLeft: Spacing.sm,
    gap: 2,
  },
  summaryTitle: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  fileName: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
  },
  fileDetails: {
    fontSize: Typography.sizes.xs,
  },
  sectionHeading: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingLeft: 2,
  },
  formatRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  formatBtn: {
    flex: 1,
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
  },
  optionsCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  optionIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  optionTextWrap: {
    flex: 1,
    gap: 1,
  },
  optionTitle: {
    fontSize: Typography.sizes.xs + 0.5,
    fontWeight: '800',
  },
  optionSubtitle: {
    fontSize: Typography.sizes.xxs,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  progressCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.md,
    flexDirection: 'column',
    gap: Spacing.xs,
  },
  progressText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
  },
  shareAppsRow: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  appBtn: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  appIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLabel: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  bottomCtaBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  saveFilesBtn: {
    flex: 1,
  },
  exportBtn: {
    flex: 1.5,
  },
});
