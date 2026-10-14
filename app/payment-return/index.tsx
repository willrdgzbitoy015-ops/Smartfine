import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

// PayMongo's return page links back here after a GCash checkout. My Fines,
// underneath, confirms the payment with the server, so this screen only
// steps back to it. It never marks anything paid.
export default function PaymentReturn() {
  const router = useRouter();

  useEffect(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/student/fines");
    }
  }, [router]);

  return (
    <View style={styles.screen}>
      <ActivityIndicator size="large" color="#173A73" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F4F9",
  },
});
