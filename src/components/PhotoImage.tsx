import { Image } from 'expo-image';
import type { StyleProp } from 'react-native';
import type { ImageStyle } from 'expo-image';
import { photoUrl } from '@/mocks/home-mocks';
import { colors } from '@/theme';

type Props = { seed: number; width: number; height: number; style?: StyleProp<ImageStyle> };

/** A placeholder food photo: cached on disk, fading in over the banner colour while it loads. */
export function PhotoImage({ seed, width, height, style }: Props) {
  return (
    <Image
      source={{ uri: photoUrl(seed, width, height) }}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={150}
      style={[{ backgroundColor: colors.bannerPlaceholder }, style]}
    />
  );
}
