import { Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

import type { Pager } from "@/hooks/use-pagination";
import { pageNumbers } from "./page-numbers";
import { styles } from "./pagination.styles";

// "‹ Prev  1  2  3  Next ›" under a list, with "Showing 11–20 of 54 fines" at
// the other end. Nothing shows while everything fits on one page.
export function Pagination({
  pager,
  noun,
}: {
  pager: Pager;
  // What the list holds, for the "Showing" text: "fines", "students".
  noun: string;
}) {
  const { width } = useWindowDimensions();

  const compact = width < 600;

  if (pager.pageCount <= 1) {
    return null;
  }

  const go = (next: number) => pager.setPage(next);

  return (
    <View style={[styles.bar, compact && styles.barCompact]}>
      <Text style={styles.summary}>
        Showing {pager.from}–{pager.to} of {pager.total} {noun}
      </Text>

      <View style={[styles.buttons, compact && styles.buttonsCompact]}>
        {pager.page > 1 && (
          <TouchableOpacity
            style={[styles.page, styles.step]}
            onPress={() => go(pager.page - 1)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Previous page"
          >
            <Text style={styles.pageText}>‹ Prev</Text>
          </TouchableOpacity>
        )}

        {pageNumbers(pager.page, pager.pageCount).map((item, index) =>
          item === "gap" ? (
            <Text key={`gap-${index}`} style={styles.gap}>
              …
            </Text>
          ) : (
            <TouchableOpacity
              key={item}
              style={[styles.page, item === pager.page && styles.pageActive]}
              onPress={() => go(item)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Page ${item}`}
              accessibilityState={{ selected: item === pager.page }}
            >
              <Text
                style={[
                  styles.pageText,
                  item === pager.page && styles.pageTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ),
        )}

        {pager.page < pager.pageCount && (
          <TouchableOpacity
            style={[styles.page, styles.step]}
            onPress={() => go(pager.page + 1)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Next page"
          >
            <Text style={styles.pageText}>Next ›</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
