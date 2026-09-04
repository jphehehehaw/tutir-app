import { StyleSheet, Text, View } from 'react-native';

export default function MatematicaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Matemática A</Text>
      <Text style={styles.subtitle}>Módulo de preparação para os exames nacionais.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#94a3b8', textAlign: 'center' },
});