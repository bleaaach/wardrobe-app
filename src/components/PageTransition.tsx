import React from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function PageTransition({ children, style }: PageTransitionProps) {
  const progress = useSharedValue(0);
  const isVisible = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    const translateY = interpolate(progress.value, [0, 1], [8, 0]);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const animateIn = useCallback(() => {
    progress.value = 0;
    isVisible.value = true;
    progress.value = withTiming(1, { duration: 300 });
  }, [progress, isVisible]);

  const animateOut = useCallback(() => {
    isVisible.value = false;
    progress.value = withTiming(0, { duration: 150 });
  }, [progress, isVisible]);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        animateIn();
      }, 50);
      return () => {
        clearTimeout(timer);
        animateOut();
      };
    }, [animateIn, animateOut])
  );

  return (
    <Animated.View style={[animatedStyle, { flex: 1 }, style]}>
      {children}
    </Animated.View>
  );
}
