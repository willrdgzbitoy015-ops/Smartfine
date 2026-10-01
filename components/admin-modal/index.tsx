import { ReactNode, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { FadeIn, PopIn } from "@/components/motion";
import { SkeletonList } from "@/components/skeleton";
import { formatNotificationTime } from "@/hooks/use-notification-counts";
import { styles } from "./admin-modal.styles";

// One Admin pop-up. Views inside it (a list, then a record) switch in place,
// so there is never a modal stacked on another modal.
export function AdminModal({
  visible,
  title,
  subtitle,
  onClose,
  onBack,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onBack ?? onClose}
    >
      <View style={styles.overlay}>
        <PopIn style={styles.card} accessibilityViewIsModal>
          <View style={styles.header}>
            {onBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                {/* Same back arrow as the Admin profile screens. */}
                <Image
                  source={require("../../assets/icons/back_icon.png")}
                  style={styles.backIcon}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={`Close ${title}`}
            >
              <Text style={styles.iconButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* Each view has its own title, so a new view (list → record)
              fades in when the title changes. */}
          <FadeIn
            key={title}
            distance={8}
            duration={220}
            style={styles.viewContent}
          >
            {children}
          </FadeIn>
        </PopIn>
      </View>
    </Modal>
  );
}

export type AdminNotice = {
  id: number;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

export type AdminNoticeFilter<T extends AdminNotice> = {
  key: string;
  label: string;
  test: (notice: T) => boolean;
};

// Unread first, then newest.
function byUnreadThenNewest(a: AdminNotice, b: AdminNotice) {
  if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
  return b.createdAt.localeCompare(a.createdAt) || b.id - a.id;
}

export function AdminNoticeList<T extends AdminNotice>({
  notices,
  filters,
  loading = false,
  error = "",
  onRetry,
  onOpen,
  emptyText,
  action,
}: {
  notices: T[];
  filters: AdminNoticeFilter<T>[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onOpen: (notice: T) => void;
  emptyText: string;
  action?: { label: string; onPress: () => void; disabled?: boolean };
}) {
  const [filterKey, setFilterKey] = useState(filters[0]?.key ?? "");
  const activeFilter =
    filters.find((filter) => filter.key === filterKey) ?? filters[0];
  const visibleNotices = [
    ...(activeFilter ? notices.filter(activeFilter.test) : notices),
  ].sort(byUnreadThenNewest);

  return (
    <>
      <View style={styles.filters}>
        {filters.map((filter) => {
          const active = filter.key === activeFilter?.key;
          const count = notices.filter(filter.test).length;

          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilterKey(filter.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {filter.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
        {action && (
          <TouchableOpacity
            style={styles.filterAction}
            onPress={action.onPress}
            disabled={action.disabled}
            accessibilityRole="button"
          >
            <Text
              style={[
                styles.filterActionText,
                action.disabled && styles.buttonDisabled,
              ]}
            >
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading && notices.length === 0 ? (
        <SkeletonList
          label="Loading notifications"
          count={4}
          avatar={false}
          style={styles.skeleton}
        />
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.stateTitle}>Notifications unavailable</Text>
          <Text style={styles.centerHint}>{error}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.linkButton} onPress={onRetry}>
              <Text style={styles.linkText}>Try again</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : visibleNotices.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.centerHint}>{emptyText}</Text>
        </View>
      ) : (
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {visibleNotices.map((notice, index) => (
            <FadeIn key={notice.id} index={index}>
              <TouchableOpacity
                style={[styles.noticeRow, !notice.isRead && styles.noticeUnread]}
                onPress={() => onOpen(notice)}
                accessibilityRole="button"
                accessibilityLabel={`${notice.title}. ${notice.isRead ? "Read" : "New"}`}
              >
                <View
                  style={[
                    styles.noticeDot,
                    notice.isRead && styles.noticeDotRead,
                  ]}
                />
                <View style={styles.noticeBody}>
                  <Text style={styles.noticeTitle}>{notice.title}</Text>
                  <Text style={styles.noticeMessage}>{notice.message}</Text>
                  <Text style={styles.noticeDate}>
                    {formatNotificationTime(notice.createdAt)}
                  </Text>
                </View>
                <Text
                  style={
                    notice.isRead ? styles.noticeReadLabel : styles.noticeNewLabel
                  }
                >
                  {notice.isRead ? "READ" : "NEW"}
                </Text>
                <Text style={styles.noticeChevron}>›</Text>
              </TouchableOpacity>
            </FadeIn>
          ))}
          <Text style={styles.listFooter}>
            Showing {visibleNotices.length} of {notices.length}
          </Text>
        </ScrollView>
      )}
    </>
  );
}
