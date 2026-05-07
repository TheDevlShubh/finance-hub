import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { Shield, AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { encode as btoa } from 'base-64';
import { Footer } from '../components/Footer';
import { ScrollView } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    const cleanEmail = email.toLowerCase().trim();
    
    if (!cleanEmail || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      // 1. Direct Document Fetch (Faster and more reliable)
      const userRef = doc(db, 'public_users', cleanEmail);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        setErrorMsg('Account not found. Please check your email or create a new account.');
        setIsLoading(false);
        return;
      }

      const userData = userSnap.data();
      
      // 2. Password Check
      let encodedPassword = '';
      try {
        encodedPassword = btoa(password);
      } catch (e) {
        setErrorMsg('Encryption error. Please try a different password.');
        setIsLoading(false);
        return;
      }

      if (userData.password !== encodedPassword) {
        setErrorMsg('Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      // 3. Success
      await AsyncStorage.setItem('financehub_user_email', cleanEmail);
      router.replace('/(tabs)');
      
    } catch (e: any) {
      console.error('Login Detail Error:', e);
      // Detailed error for debugging
      if (e.code === 'permission-denied') {
        setErrorMsg('Firebase Permission Denied. Check Security Rules.');
      } else if (e.message.includes('network')) {
        setErrorMsg('Network error. Check your phone internet.');
      } else {
        setErrorMsg('Error: ' + (e.message || 'Unknown server error.'));
      }
    }
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Background Blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex1}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Shield size={40} color="white" />
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Log in to access your financial dashboard.</Text>
              </View>

              {errorMsg ? (
                <View style={styles.errorCard}>
                  <AlertCircle size={20} color="#dc2626" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="name@gmail.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput 
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.loginButton, isLoading && { opacity: 0.7 }]} 
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <Text style={styles.signUpText}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Footer />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', position: 'relative', overflow: 'hidden' },
  flex1: { flex: 1 },
  safeArea: { flex: 1 },
  blob1: { position: 'absolute', top: -height * 0.1, left: -width * 0.2, width: width, height: width, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: width / 2 },
  blob2: { position: 'absolute', bottom: -height * 0.1, right: -width * 0.2, width: width, height: width, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: width / 2 },
  content: { flex: 1, padding: 32, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoContainer: { width: 80, height: 80, backgroundColor: '#2563eb', borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '900', color: '#0f172a', letterSpacing: -1 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 12, fontWeight: '500', lineHeight: 24 },
  errorCard: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#fecaca', flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  errorText: { color: '#dc2626', fontSize: 14, fontWeight: '700', flex: 1 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: '#475569', marginLeft: 4 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, padding: 16, fontSize: 16, fontWeight: '500', color: '#1e293b' },
  loginButton: { backgroundColor: '#2563eb', padding: 20, borderRadius: 20, alignItems: 'center', marginTop: 12, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  loginButtonText: { color: 'white', fontSize: 18, fontWeight: '900' },
  signUpText: { fontSize: 14, color: '#2563eb', fontWeight: '800' },
  scrollContent: { flexGrow: 1, justifyContent: 'center' },
  footerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, gap: 6 },
});
