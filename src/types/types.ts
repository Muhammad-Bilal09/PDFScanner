import { ReactNode } from 'react';

export type Point = {
  x: number;
  y: number;
}

export type FilterType = 'original' | 'magic' | 'bw' | 'grayscale' | 'receipt' | 'sharpen';

export type PageItemType = {
  id: string;
  originalUri: string;
  croppedUri?: string;
  processedUri?: string;
  thumbnailUri?: string;
  corners?: Point[];
  filter?: FilterType | string;
  rotation?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
}

export type DocumentItemType = {
  id: string;
  title?: string;
  name?: string;
  date?: string;
  createdAt?: number;
  updatedAt?: number;
  pages?: number | any;
  pagesList?: PageItemType[];
  category?: string;
  tags?: string[];
  pdfUri?: string;
  size?: string;
  pdfSizeFormatted?: string;
  syncedAt?: number;
  favorite?: boolean;
  thumbColor?: string;
}

export type DocumentFilter = 'all' | 'scans' | 'documents' | 'receipts' | 'cards';

export type AppSettings = {
  autoCrop: boolean;
  defaultFilter: FilterType;
  pdfQuality: CompressionQuality;
  saveToGallery: boolean;
  cloudSyncEnabled?: boolean;
  darkTheme: boolean;
  darkMode?: boolean;
  ocrLanguage: string;
  watermarkText?: string;
};

export type ActiveTab = 'home' | 'files' | 'tools' | 'settings' | 'scan';

export type EdgeDetectionResult = {
  detected: boolean;
  points: Point[];
  confidence: number;
  width: number;
  height: number;
}

export type TaskCallback = {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
};

export type BatchProgressCallback = (current: number, total: number, message: string) => void;

export type PaperSize = 'A4' | 'Letter' | 'Legal';

export type CompressionQuality = 'original' | 'high' | 'medium' | 'low';

export type PdfGenerationOptions = {
  paperSize?: PaperSize;
  quality?: CompressionQuality;
  password?: string;
  watermark?: string;
  watermarkText?: string;
  addWatermark?: boolean;
  removeWatermark?: boolean;
};

export type PickedPhotoResult = {
  uri: string;
  width: number;
  height: number;
}

export type HeaderAction = {
  icon: string;
  onPress: () => void;
  label?: string;
  color?: string;
  fallback?: string;
}

export type HeaderProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onBackPress?: () => void;
  actions?: HeaderAction[];
  rightActions?: HeaderAction[];
  style?: object;
}

export type DocumentCardProps = {
  item: DocumentItemType | any;
  document?: DocumentItemType;
  onPress: () => void;
  onMorePress?: () => void;
  onMenuPress?: () => void;
  onSharePress?: () => void;
  onDeletePress?: () => void;
  viewMode?: 'grid' | 'list';
}

export type DocumentCropViewProps = {
  imageUri: string;
  initialPoints?: Point[];
  onCropChange?: (points: Point[]) => void;
  imageWidth: number;
  imageHeight: number;
  onCancel?: () => void;
  onSave?: (points: Point[]) => void;
}

export type EmptyViewProps = {
  icon?: string;
  fallback?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  onActionPress?: () => void;
  style?: any;
}

export type LoadingViewProps = {
  message?: string;
  fullscreen?: boolean;
  style?: any;
}

export type PrimaryButtonProps = {
  title?: string;
  label?: string;
  onPress: () => void;
  icon?: string;
  iconFallback?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}

export type OutlineButtonProps = {
  title?: string;
  label?: string;
  onPress: () => void;
  icon?: string;
  iconFallback?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onClear?: () => void;
  placeholder?: string;
}

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  style?: any;
}

export type IconProps = {
  name?: string;
  sf: string;
  fallback?: string;
  size?: number;
  color?: string;
  weight?: any;
  style?: any;
}

export type TabBarProps = {
  activeTab: ActiveTab;
  onTabPress?: (tab: ActiveTab) => void;
  onScanPress?: () => void;
}

export type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: string;
  badgeCount?: number;
}

export type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  iconBgColor?: string;
  onPress?: () => void;
}

export type PageGridItemProps = {
  page: PageItemType;
  index?: number;
  pageNum?: number;
  totalCount?: number;
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: () => void;
  onSelect?: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onDuplicate?: () => void;
  onPressMoveUp?: () => void;
  onPressMoveDown?: () => void;
}

export type SliderProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  onComplete: (val: number) => void;
}

export type PageGridItemsProps = {
  page: PageItemType;
  pageNum: number;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
  onDelete: () => void;
  onRotate: () => void;
  onDuplicate: () => void;
  onPressMoveUp: () => void;
  onPressMoveDown: () => void;
}


export type LegacyDocumentItem = {
  id: string;
  name?: string;
  title?: string;
  date?: string;
  createdAt?: number;
  updatedAt?: number;
  size?: string;
  pdfSizeFormatted?: string;
  pages?: number | any[];
  pagesList?: PageItemType[];
  thumbColor?: string;
  tags?: string[];
  favorite?: boolean;
}

export type DocumentCardsProps = {
  item: LegacyDocumentItem | DocumentItemType | any;
  viewMode?: 'list' | 'grid';
  onPress: () => void;
  onMenuPress?: () => void;
}