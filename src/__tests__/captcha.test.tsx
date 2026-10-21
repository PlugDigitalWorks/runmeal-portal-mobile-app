import { fireEvent, render, screen } from '@testing-library/react-native';
import { Keyboard, Pressable, Text } from 'react-native';
import { useCaptcha } from '@/hooks/useCaptcha';

// The sheet hosts the reCAPTCHA webview; only the hook's own behaviour is under test.
jest.mock('@/components/CaptchaSheet', () => ({ CaptchaSheet: () => null }));

function Probe() {
  const { requestToken, sheet } = useCaptcha();
  return (
    <>
      <Pressable onPress={() => void requestToken()}>
        <Text>verify</Text>
      </Pressable>
      {sheet}
    </>
  );
}

it('dismisses the keyboard before opening the captcha', async () => {
  const dismiss = jest.spyOn(Keyboard, 'dismiss');
  await render(<Probe />);
  await fireEvent.press(screen.getByText('verify'));
  expect(dismiss).toHaveBeenCalled();
});
