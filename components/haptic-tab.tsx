import { Pressable, PressableProps, StyleSheet, Platform, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ReactNode } from 'react';

interface HapticTabProps extends PressableProps {
  href: string;          // route to navigate to
  children: ReactNode;   // icon or label to display
}

export function HapticTab({ href, children, ...pressableProps }: HapticTabProps) {
  const router = useRouter();

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.navigate(href);  // better than push for tabs
  };

  return (
    <Pressable
      {...pressableProps}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.tab,
        pressed && styles.pressed,
        pressableProps.style as any,
      ]}
    >
      {typeof children === 'string' ? <Text>{children}</Text> : children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});