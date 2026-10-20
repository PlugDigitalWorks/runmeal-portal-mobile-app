import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Screen } from '@/ui/Screen';

/** Placeholder until the restaurant screen lands; it only proves the route and its param. */
export default function Restaurant() {
  const { branchId } = useLocalSearchParams<{ branchId: string }>();
  return (
    <Screen padded>
      <Text>{branchId}</Text>
    </Screen>
  );
}
