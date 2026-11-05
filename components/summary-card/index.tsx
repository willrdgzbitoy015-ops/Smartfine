import { Children, createContext, ReactNode, useContext, useState } from "react";
import { Animated, StyleProp, Text, View, ViewStyle } from "react-native";

import { FadeIn, PressableScale } from "@/components/motion";
import { Skeleton } from "@/components/skeleton";

import { styles } from "./summary-card.styles";

export type SummaryTone =
  | "attention"
  | "danger"
  | "money"
  | "success"
  | "info"
  | "neutral";

const HIGHLIGHT: Partial<
  Record<SummaryTone, "attentionHighlight" | "infoHighlight" | "dangerHighlight">
> = {
  attention: "attentionHighlight",
  info: "infoHighlight",
  danger: "dangerHighlight",
};

const GAP = 16;
const MIN_CARD_WIDTH = 150;
// Below this, values use a smaller size so amounts fit.
const NARROW_CARD_WIDTH = 200;

// Width each card should take, set by the row once it has been measured.
const CardWidthContext = createContext<number | undefined>(undefined);

// A card's position in its row, used to stagger the entrance.
const CardIndexContext = createContext(0);

// The Admin summary card: coloured top border, value, hint, and a › when
// the card opens something. Shared by Dashboard, Fines, Reports, Students.
export function SummaryCard({
  label,
  value,
  hint,
  tone,
  highlighted = false,
  loading = false,
  onPress,
  animatedStyle,
}: {
  label: string;
  value: string;
  hint: string;
  tone: SummaryTone;
  highlighted?: boolean;
  loading?: boolean;
  onPress?: () => void;
  animatedStyle?: StyleProp<ViewStyle> | Animated.WithAnimatedValue<ViewStyle>;
}) {
  const cardWidth = useContext(CardWidthContext);

  const index = useContext(CardIndexContext);

  const highlight = highlighted ? HIGHLIGHT[tone] : undefined;

  const narrow = cardWidth !== undefined && cardWidth < NARROW_CARD_WIDTH;

  const content = (
    <View style={styles.body}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>

      {/* The value and hint sit at the bottom, so they line up across a row even when one label wraps to two lines. */}
      <View style={styles.bottom}>
      {/* A pulsing bar while loading; the number fades in when it arrives. */}
      {loading ? (
        <Skeleton
          width="55%"
          height={narrow ? 26 : 32}
          radius={8}
          style={styles.valueSkeleton}
        />
      ) : (
        <FadeIn key="value" distance={4} duration={260}>
          <Text
            style={[
              styles.value,
              narrow && styles.valueNarrow,
              styles[`${tone}Value`],
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {value}
          </Text>
        </FadeIn>
      )}

      <View style={styles.footer}>
        {/* Hints are built from the data, so they pulse too until it loads. */}
        {loading ? (
          <View style={styles.hint}>
            <Skeleton width="70%" height={10} />
          </View>
        ) : (
          <Text style={styles.hint} numberOfLines={2}>
            {hint}
          </Text>
        )}
        {onPress && <Text style={styles.chevron}>›</Text>}
      </View>
      </View>
    </View>
  );

  const cardStyle = [
    styles.card,
    styles[tone],
    highlight && styles[highlight],
  ];

  // The whole card shrinks slightly while pressed.
  const card = onPress ? (
    <PressableScale
      style={cardStyle}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${loading ? "loading" : value}. ${hint}`}
    >
      {content}
    </PressableScale>
  ) : (
    <View style={cardStyle}>{content}</View>
  );

  // The slot sizes the card in its row and runs the entrance.
  const slotStyle = [
    styles.slot,
    cardWidth !== undefined && {
      width: cardWidth,
      flexBasis: cardWidth,
      flexGrow: 0,
      minWidth: 0,
    },
  ];

  // The dashboard supplies its own entrance; elsewhere cards stagger in.
  return animatedStyle ? (
    <Animated.View
      style={[...slotStyle, animatedStyle as StyleProp<ViewStyle>]}
    >
      {card}
    </Animated.View>
  ) : (
    <FadeIn index={index} style={slotStyle}>
      {card}
    </FadeIn>
  );
}

// Lays cards out in even rows: 4 cards as 4 or 2×2, 6 cards as 6, 3×2 or
// 2×3, so a single card never ends up alone and stretched on a row.
export function SummaryCardRow({ children }: { children: ReactNode }) {
  const [rowWidth, setRowWidth] = useState(0);

  const count = Children.toArray(children).length;

  let cardWidth: number | undefined;

  if (rowWidth > 0 && count > 0) {
    const fits = Math.max(
      1,
      Math.floor((rowWidth + GAP) / (MIN_CARD_WIDTH + GAP)),
    );

    let columns = Math.min(fits, count);

    let even = columns;

    while (even > 1 && count % even !== 0) {
      even -= 1;
    }

    // Keep an uneven last row rather than collapse to one column.
    if (even > 1) {
      columns = even;
    }

    // Rounded down so rounding never pushes the last card to a new line.
    cardWidth = Math.floor((rowWidth - GAP * (columns - 1)) / columns);
  }

  return (
    <View
      style={styles.row}
      onLayout={(event) => {
        const width = Math.floor(event.nativeEvent.layout.width);

        setRowWidth((current) => (current === width ? current : width));
      }}
    >
      <CardWidthContext.Provider value={cardWidth}>
        {Children.map(children, (child, index) => (
          <CardIndexContext.Provider value={index}>
            {child}
          </CardIndexContext.Provider>
        ))}
      </CardWidthContext.Provider>
    </View>
  );
}
