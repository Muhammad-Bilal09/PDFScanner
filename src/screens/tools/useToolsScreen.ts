import { showAlert } from '@/utils/alert';
import { useRouter } from 'expo-router';
import { pickPhotoWithPermissions } from '@/utils/photoPicker';
import { useTheme } from '@/hooks/useTheme';

export function useToolsScreen() {
  const router = useRouter();
  const theme = useTheme();

  const handleImportPhotos = async () => {
    const picked = await pickPhotoWithPermissions();
    if (picked) {
      router.push({
        pathname: '/scan' as any,
        params: {
          importUri: picked.uri,
          width: picked.width,
          height: picked.height,
        },
      });
    }
  };

  const handleToolPress = (toolName: string) => {
    if (toolName === 'Photos to PDF') {
      handleImportPhotos();
    } else {
      showAlert(
        'Tool Selected',
        `${toolName} feature is ready in the main scanner menu. Start scanning or import images to use.`
      );
    }
  };

  return {
    router,
    theme,
    handleImportPhotos,
    handleToolPress,
  };
}
