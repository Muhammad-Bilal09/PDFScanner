import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Alert, Linking, Platform } from 'react-native';

export interface PickedPhotoResult {
  uri: string;
  width: number;
  height: number;
}

/**
 * Optimizes large photos by downscaling to max 1920px dimensions
 * and compressing slightly to prevent high memory usage and OOM crashes during CV processing.
 * Always ensures the returned URI is a clean local file:// URI in cache.
 */
export async function optimizeImageForScanning(
  uri: string,
  width?: number,
  height?: number
): Promise<PickedPhotoResult> {
  const MAX_DIMENSION = 1920;
  const originalWidth = width && width > 0 ? width : 1920;
  const originalHeight = height && height > 0 ? height : 1920;

  const aspectRatio = originalWidth / originalHeight;
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;

  if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
    if (originalWidth >= originalHeight) {
      targetWidth = MAX_DIMENSION;
      targetHeight = Math.round(MAX_DIMENSION / aspectRatio);
    } else {
      targetHeight = MAX_DIMENSION;
      targetWidth = Math.round(MAX_DIMENSION * aspectRatio);
    }
  }

  try {
    const actions = (targetWidth !== originalWidth || targetHeight !== originalHeight)
      ? [{ resize: { width: targetWidth, height: targetHeight } }]
      : [];

    const manipulated = await manipulateAsync(
      uri,
      actions,
      { compress: 0.9, format: SaveFormat.JPEG }
    );
    return {
      uri: manipulated.uri,
      width: manipulated.width || targetWidth,
      height: manipulated.height || targetHeight,
    };
  } catch (err) {
    console.warn('[PhotoPicker] Image optimization failed, using fallback:', err);
    return { uri, width: originalWidth, height: originalHeight };
  }
}

/**
 * Checks and requests photo library permissions across Android (including API 33+) and iOS.
 */
async function checkMediaPermissions(): Promise<boolean> {
  let perm = await ImagePicker.getMediaLibraryPermissionsAsync();

  if (!perm.granted && perm.canAskAgain) {
    perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  }

  const isAndroid13Plus = Platform.OS === 'android' && typeof Platform.Version === 'number' && Platform.Version >= 33;
  const isPermitted = perm.granted || isAndroid13Plus;

  if (!isPermitted && !perm.canAskAgain) {
    Alert.alert(
      'Photo Library Permission Required',
      'DocScan Pro needs access to your photo library to import images. Please grant permission in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => {
            Linking.openSettings().catch(() => {
              Alert.alert('Error', 'Unable to open settings automatically.');
            });
          },
        },
      ]
    );
    return false;
  }

  if (!isPermitted) {
    Alert.alert(
      'Permission Denied',
      'Cannot import photos without library permission.'
    );
    return false;
  }

  return true;
}

/**
 * Safely requests media library permissions and launches single image picker.
 */
export async function pickPhotoWithPermissions(): Promise<PickedPhotoResult | null> {
  try {
    const permitted = await checkMediaPermissions();
    if (!permitted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    return await optimizeImageForScanning(asset.uri, asset.width, asset.height);
  } catch (error: any) {
    console.error('[PhotoPicker] Error picking photo:', error);
    Alert.alert(
      'Import Error',
      error?.message || 'Failed to select image from photo library.'
    );
    return null;
  }
}

/**
 * Safely requests media library permissions and launches multiple image picker.
 */
export async function pickMultiplePhotosWithPermissions(): Promise<PickedPhotoResult[] | null> {
  try {
    const permitted = await checkMediaPermissions();
    if (!permitted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
      allowsMultipleSelection: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const output: PickedPhotoResult[] = [];
    for (const asset of result.assets) {
      const optimized = await optimizeImageForScanning(asset.uri, asset.width, asset.height);
      output.push(optimized);
    }
    return output;
  } catch (error: any) {
    console.error('[PhotoPicker] Error picking photos:', error);
    Alert.alert(
      'Import Error',
      error?.message || 'Failed to select images from photo library.'
    );
    return null;
  }
}

