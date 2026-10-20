import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PhotoImage } from '@/components/PhotoImage';

const TILT = ['-3deg', '2deg', '2deg', '-3deg'];
const GAP = 6;
const PAD = 3;

/**
 * Four white-framed photos in a 2x2 grid, each slightly tilted like stickers on a poster. The tiles
 * are sized from the measured room (Yoga stretched flex tiles past a fixed-height parent), so the
 * grid fills whatever box the poster gives it, wide or tall.
 */
export function PhotoGrid({ seeds }: { seeds: number[] }) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const tileW = box ? (box.w - PAD * 2 - GAP) / 2 : 0;
  const tileH = box ? (box.h - PAD * 2 - GAP) / 2 : 0;
  return (
    <View style={styles.grid} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {box
        ? seeds.slice(0, 4).map((seed, i) => (
            <View
              key={seed}
              style={[
                styles.tile,
                { width: tileW, height: tileH, left: PAD + (i % 2) * (tileW + GAP), top: PAD + Math.floor(i / 2) * (tileH + GAP), transform: [{ rotate: TILT[i] }] },
              ]}
            >
              <PhotoImage seed={seed} width={160} height={160} style={StyleSheet.absoluteFill} />
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flex: 1 },
  tile: { position: 'absolute', borderRadius: 8, borderWidth: 2, borderColor: '#FFFFFF', overflow: 'hidden', backgroundColor: '#FFFFFF' },
});
