import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  type ImageSourcePropType,
  Pressable,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NATIVE_DRIVER, useReducedMotion } from "@/components/motion";
import { HomeTabBadge } from "@/components/notification-badge";
import { haptics } from "@/utils/haptics";
import { BAR_PADDING, BUBBLE, styles } from "./floating-tab-bar.styles";

export type TabBarItem = {
  label: string;
  icon: ImageSourcePropType;
  disabled?: boolean;
};

// Where the filled circle was on the last tab screen, per set of tabs. Each
// tab is its own screen, so a new bar starts the circle where the previous
// screen's bar left it and slides it to its own tab: it reads as one bar
// moving across the cross-fade between screens.
const lastPosition: Record<string, number> = {};

// The Officer and Student bottom navigation: a white bar floating above the
// screen edge, a navy circle behind the active tab's icon that slides between
// tabs, grey icons and labels for the others, a small lift when a tab becomes
// active and a squeeze while it is pressed.
export function FloatingTabBar<T extends TabBarItem>({
  items,
  active,
  onSelect,
  disabled = false,
}: {
  items: readonly T[];
  // Label of the tab this screen belongs to.
  active: string;
  // Runs for every tap, including the active tab (a screen may reload).
  onSelect: (item: T) => void;
  // Blocks every tab, e.g. while a form is saving.
  disabled?: boolean;
}) {
  const insets = useSafeAreaInsets();

  const reduced = useReducedMotion();

  const group = items.map((item) => item.label).join("|");

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.label === active),
  );

  const [barWidth, setBarWidth] = useState(0);

  const cameFrom = useRef(lastPosition[group]);

  const [position] = useState(
    () => new Animated.Value(lastPosition[group] ?? activeIndex),
  );

  useEffect(() => {
    lastPosition[group] = activeIndex;

    if (reduced) {
      position.setValue(activeIndex);
      return;
    }

    const slide = Animated.spring(position, {
      toValue: activeIndex,
      friction: 9,
      tension: 110,
      useNativeDriver: NATIVE_DRIVER,
    });

    slide.start();

    return () => slide.stop();
  }, [activeIndex, group, reduced, position]);

  const count = items.length;

  const itemWidth = (barWidth - BAR_PADDING * 2) / count;

  const bubbleX =
    barWidth > 0 && count > 1
      ? position.interpolate({
          inputRange: items.map((_, index) => index),
          outputRange: items.map(
            (_, index) =>
              BAR_PADDING + itemWidth * index + (itemWidth - BUBBLE) / 2,
          ),
        })
      : null;

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 8) + 6 }]}
    >
      <View
        style={styles.bar}
        onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
        accessibilityRole="tablist"
      >
        {bubbleX && (
          <Animated.View
            pointerEvents="none"
            style={[styles.bubble, { transform: [{ translateX: bubbleX }] }]}
          />
        )}

        {items.map((item, index) => (
          <TabItem
            key={item.label}
            item={item}
            index={index}
            position={position}
            active={index === activeIndex}
            // Arriving from another tab: lift the icon once the circle lands.
            arrived={
              index === activeIndex &&
              cameFrom.current !== undefined &&
              cameFrom.current !== activeIndex
            }
            disabled={disabled || item.disabled === true}
            reduced={reduced}
            onPress={() => {
              if (index !== activeIndex) {
                haptics.selection();
              }

              onSelect(item);
            }}
          />
        ))}
      </View>
    </View>
  );
}

function TabItem({
  item,
  index,
  position,
  active,
  arrived,
  disabled,
  reduced,
  onPress,
}: {
  item: TabBarItem;
  index: number;
  position: Animated.Value;
  active: boolean;
  arrived: boolean;
  disabled: boolean;
  reduced: boolean;
  onPress: () => void;
}) {
  // 1 while the circle is on this tab, 0 once it has left; in between while it
  // slides past, so icons and labels change colour with the circle.
  const on = position.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [0, 1, 0],
    extrapolate: "clamp",
  });

  const off = on.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  const [press] = useState(() => new Animated.Value(1));

  const [lift] = useState(() => new Animated.Value(0));

  // The icon hops once the circle lands, when this screen was opened from
  // another tab.
  useEffect(() => {
    if (!arrived || reduced) {
      return;
    }

    const hop = Animated.sequence([
      Animated.delay(120),
      Animated.timing(lift, {
        toValue: -5,
        duration: 120,
        easing: Easing.out(Easing.quad),
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.spring(lift, {
        toValue: 0,
        friction: 5,
        tension: 170,
        useNativeDriver: NATIVE_DRIVER,
      }),
    ]);

    hop.start();

    return () => hop.stop();
  }, [arrived, reduced, lift]);

  const squeeze = (toValue: number) => {
    if (reduced) {
      return;
    }

    Animated.spring(press, {
      toValue,
      friction: 6,
      tension: 220,
      useNativeDriver: NATIVE_DRIVER,
    }).start();
  };

  return (
    <Pressable
      style={[styles.item, disabled && styles.itemDisabled]}
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => squeeze(0.88)}
      onPressOut={() => squeeze(1)}
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active, disabled }}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          { transform: [{ translateY: lift }, { scale: press }] },
        ]}
      >
        <Animated.Image
          source={item.icon}
          resizeMode="contain"
          style={[styles.icon, styles.iconOff, { opacity: off }]}
        />

        <Animated.Image
          source={item.icon}
          resizeMode="contain"
          style={[styles.icon, styles.iconOn, { opacity: on }]}
        />
      </Animated.View>

      <View style={styles.labelBox}>
        <Animated.Text style={[styles.label, styles.labelOff, { opacity: off }]}>
          {item.label}
        </Animated.Text>

        <Animated.Text style={[styles.label, styles.labelOn, { opacity: on }]}>
          {item.label}
        </Animated.Text>
      </View>

      <HomeTabBadge label={item.label} />
    </Pressable>
  );
}
