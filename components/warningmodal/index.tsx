import { Modal, Text, TouchableOpacity, View } from "react-native";

import { styles } from "./warningmodal.styles";

type WarningModalProps = {
  visible: boolean;
  title?: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
};

export default function WarningModal({
  visible,
  title = "Notice",
  message,
  buttonText = "OK",
  onClose,
}: WarningModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* ======================================
              WARNING ICON
          ====================================== */}

          <View style={styles.warningIconContainer}>
            <Text style={styles.warningIcon}>!</Text>
          </View>

          {/* ======================================
              TITLE
          ====================================== */}

          <Text style={styles.title}>{title}</Text>

          {/* ======================================
              MESSAGE
          ====================================== */}

          <Text style={styles.message}>{message}</Text>

          {/* ======================================
              OK BUTTON
          ====================================== */}

          <TouchableOpacity
            style={styles.okButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.okButtonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
