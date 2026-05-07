import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';

export const Footer = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>Developed with</Text>
      <Heart size={14} color="#ef4444" fill="#ef4444" style={styles.icon} />
      <Text style={styles.text}>by </Text>
      <Text style={styles.name}>Shubh</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#facc15',
    marginVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#000',
  },
  text: {
    fontSize: 18,
    color: '#000',
    fontWeight: '900',
  },
  name: {
    fontSize: 18,
    color: '#000',
    fontWeight: '900',
    textDecorationLine: 'underline',
  },
  icon: {
    marginHorizontal: 4,
  },
});
