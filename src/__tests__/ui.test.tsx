import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import '@/i18n';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Price } from '@/ui/Price';
import { QuantityStepper } from '@/ui/QuantityStepper';
import { Screen } from '@/ui/Screen';
import { BranchCardSkeleton, Skeleton } from '@/ui/Skeleton';
import { TextField } from '@/ui/TextField';

it('Button fires once and not while loading', async () => {
  const onPress = jest.fn();
  await render(<Button title="Devam et" onPress={onPress} />);
  await fireEvent.press(screen.getByText('Devam et'));
  expect(onPress).toHaveBeenCalledTimes(1);
  await render(<Button title="Bekle" onPress={onPress} loading />);
  expect(screen.queryByText('Bekle')).toBeNull();
});

it('Button ignores presses while disabled', async () => {
  const onPress = jest.fn();
  await render(<Button title="Pasif" onPress={onPress} disabled />);
  await fireEvent.press(screen.getByText('Pasif'));
  expect(onPress).not.toHaveBeenCalled();
});

it('ErrorState retries', async () => {
  const onRetry = jest.fn();
  await render(<ErrorState onRetry={onRetry} />);
  expect(screen.getByText('Bağlantı kurulamadı')).toBeTruthy();
  await fireEvent.press(screen.getByText('Tekrar dene'));
  expect(onRetry).toHaveBeenCalled();
});

it('Price shows the original price struck through', async () => {
  await render(<Price value={160} original={180} currency="GBP" />);
  expect(screen.getByText('£160,00')).toBeTruthy();
  expect(screen.getByText('£180,00')).toBeTruthy();
});

it('Price hides the original when it is not higher', async () => {
  await render(<Price value={160} original={160} currency="GBP" />);
  expect(screen.getAllByText('£160,00')).toHaveLength(1);
});

it('QuantityStepper clamps to min and max', async () => {
  const onChange = jest.fn();
  await render(<QuantityStepper value={1} onChange={onChange} min={1} max={2} />);
  await fireEvent.press(screen.getByLabelText('Azalt'));
  expect(onChange).toHaveBeenLastCalledWith(1);
  await fireEvent.press(screen.getByLabelText('Artır'));
  expect(onChange).toHaveBeenLastCalledWith(2);
});

it('Chip reports presses and selection', async () => {
  const onPress = jest.fn();
  await render(<Chip label="Pizza" selected onPress={onPress} />);
  await fireEvent.press(screen.getByText('Pizza'));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { selected: true })).toBeTruthy();
});

it('EmptyState renders its action', async () => {
  const onAction = jest.fn();
  await render(<EmptyState icon={<Text>i</Text>} title="Boş" body="Henüz yok" actionLabel="Ekle" onAction={onAction} />);
  expect(screen.getByText('Henüz yok')).toBeTruthy();
  await fireEvent.press(screen.getByText('Ekle'));
  expect(onAction).toHaveBeenCalled();
});

it('TextField shows its label, forwards input and shows the error', async () => {
  const onChangeText = jest.fn();
  await render(<TextField label="E-posta" value="" onChangeText={onChangeText} error="Geçersiz" />);
  expect(screen.getByText('E-posta')).toBeTruthy();
  expect(screen.getByText('Geçersiz')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('E-posta'), 'a@b.co');
  expect(onChangeText).toHaveBeenCalledWith('a@b.co');
});

it('Screen and skeletons render', async () => {
  await render(
    <Screen scroll>
      <Skeleton height={10} />
      <BranchCardSkeleton />
      <Text>içerik</Text>
    </Screen>,
  );
  expect(screen.getByText('içerik')).toBeTruthy();
});
