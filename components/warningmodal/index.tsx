import { useEffect } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

import { PopIn } from "@/components/motion";
import { FailedMark } from "@/components/result-mark";
import { haptics } from "@/utils/haptics";

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
  // A "needs attention" vibration as the pop-up appears.
  useEffect(() => {
    if (visible) {
      haptics.warning();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <PopIn style={styles.modalCard}>
          {/* ======================================
              WARNING ICON (pops in after the card)
          ====================================== */}

          <FailedMark delay={120} size={58} style={styles.warningMark} />

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
        </PopIn>
      </View>
    </Modal>
  );
}
