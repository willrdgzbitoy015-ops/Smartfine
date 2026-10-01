import { useEffect } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

import { PopIn } from "@/components/motion";
import { haptics } from "@/utils/haptics";

import { styles } from "./success-modal.styles";

type SuccessModalProps = {
  visible: boolean;
  title?: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
};

export default function SuccessModal({
  visible,
  title = "Success!",
  message,
  buttonText = "OK",
  onClose,
}: SuccessModalProps) {
  // A short "done" vibration as the pop-up appears.
  useEffect(() => {
    if (visible) {
      haptics.success();
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
              SUCCESS ICON (pops in after the card)
          ====================================== */}

          <PopIn style={styles.iconContainer} delay={120} from={0.4}>
            <Image
              source={require("../../assets/icons/check.png")}
              style={styles.checkIcon}
              resizeMode="contain"
            />
          </PopIn>

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
