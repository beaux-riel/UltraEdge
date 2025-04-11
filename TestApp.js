import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>UltraEdge Test App</Text>
      <Text style={styles.subtext}>If you can see this, the app is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});