import { Image } from 'expo-image';

const LOGO = require('../../../assets/logo.png');

/** The Runmeal logo where other apps put a rating star; `dim` is the empty one of a five-mark row. */
export function RatingMark({ size = 14, dim }: { size?: number; dim?: boolean }) {
  return <Image source={LOGO} contentFit="contain" style={{ width: size, height: size, opacity: dim ? 0.25 : 1 }} />;
}
