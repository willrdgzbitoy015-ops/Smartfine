import {
    ActivityIndicator,
    Modal,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { PopIn } from "@/components/motion";

import { styles } from "./logout-modal.styles";

type LogoutModalProps = {
  visible: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LogoutModal({
  visible,
  loading = false,
  onCancel,
  onConfirm,
}: LogoutModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (!loading) {
          onCancel();
        }
      }}
    >
      <View style={styles.overlay}>
        <PopIn style={styles.modalCard}>
          {/* TITLE */}

          <Text style={styles.title}>Log Out?</Text>

          {/* MESSAGE */}

          <Text style={styles.message}>
            Are you sure you want to log out of your SmartFine{"\n"}
            account?
          </Text>

          {/* BUTTONS */}

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.disabledButton]}
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.logoutButton, loading && styles.disabledButton]}
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.logoutText}>Log Out</Text>
              )}
            </TouchableOpacity>
          </View>
        </PopIn>
      </View>
    </Modal>
  );
}
