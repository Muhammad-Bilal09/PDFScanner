import { Dimensions, StyleSheet } from 'react-native';
import { Radius, Shadows, Spacing, Typography } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docMetaBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  docTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  docTitleText: {
    fontSize: Typography.sizes.md,
    fontWeight: '800',
    flex: 1,
  },
  renameBtn: {
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  metaText: {
    fontSize: Typography.sizes.xs,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  toolsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  toolBtn: {
    flex: 1,
  },
  gridContainer: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 100,
  },
  reeditOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  reeditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  reeditTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: '800',
  },
  reeditBody: {
    flex: 1,
    position: 'relative',
  },
  imagePreviewWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  reeditFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.md,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
  },
  slidersContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sliderLabel: {
    fontSize: Typography.sizes.xs,
    width: 70,
    fontWeight: '600',
  },
  sliderTrack: {
    flex: 1,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderStepBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.xs,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderValText: {
    fontSize: Typography.sizes.xs,
    width: 36,
    textAlign: 'center',
    fontWeight: '700',
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  actionIconBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionIconText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: '800',
  },
  modalInput: {
    height: 44,
    borderRadius: Radius.xs,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.sizes.sm,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBtn: {
    flex: 1,
  },
});
