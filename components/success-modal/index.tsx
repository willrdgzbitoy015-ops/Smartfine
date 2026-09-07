import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

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
              SUCCESS ICON
          ====================================== */}

          <View style={styles.iconContainer}>
            <Image
              source={require("../../assets/icons/check.png")}
              style={styles.checkIcon}
              resizeMode="contain"
            />
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
