import { Image, ImageStyle, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";

export type EmojiAnimation = "float" | "bounce" | "pulse" | "wiggle" | "none";

interface AnimatedEmojiProps {
  /** Image URI or require() source */
  source: string | number;
  size?: number;
  animation?: EmojiAnimation;
  /** Delay before animation starts (ms) */
  delay?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
}

const AnimatedImage = Animated.createAnimatedComponent(Image);

export function AnimatedEmoji({
  source,
  size = 64,
  animation = "float",
  delay = 0,
  style,
  imageStyle,
}: AnimatedEmojiProps) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));

    switch (animation) {
      case "float":
        translateY.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(-8, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
              withTiming(8, { duration: 1500, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
          )
        );
        break;
      case "bounce":
        scale.value = withDelay(
          delay,
          withSequence(
            withTiming(1.2, { duration: 400, easing: Easing.out(Easing.exp) }),
            withTiming(0.9, { duration: 200 }),
            withTiming(1, { duration: 200 })
          )
        );
        break;
      case "pulse":
        scale.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
              withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            true
          )
        );
        break;
      case "wiggle":
        rotate.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(-8, { duration: 200 }),
              withTiming(8, { duration: 200 }),
              withTiming(-8, { duration: 200 }),
              withTiming(8, { duration: 200 }),
              withTiming(0, { duration: 200 })
            ),
            -1,
            true
          )
        );
        break;
      case "none":
      default:
        break;
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const uri = typeof source === "string" ? source : undefined;
  const localSource = typeof source === "number" ? source : undefined;

  return (
    <Animated.View style={[{ width: size, height: size, justifyContent: "center", alignItems: "center" }, style, animatedStyle]}>
      <AnimatedImage
        source={uri ? { uri } : localSource!}
        style={[{ width: size, height: size }, imageStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

/** Pre-built animated emoji grid for hero sections */
export function EmojiCluster({
  emojis,
  size = 56,
}: {
  emojis: { source: string | number; animation?: EmojiAnimation; delay?: number }[];
  size?: number;
}) {
  return (
    <Animated.View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
      {emojis.map((e, i) => (
        <AnimatedEmoji
          key={i}
          source={e.source}
          size={size}
          animation={e.animation ?? "float"}
          delay={e.delay ?? i * 200}
        />
      ))}
    </Animated.View>
  );
}
