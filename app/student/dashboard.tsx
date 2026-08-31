import { View, Text, StyleSheet } from 'react-native';

export default function AdminDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Login successful.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F6F8',
  },

  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#173A73',
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: '#555555',
  },
});