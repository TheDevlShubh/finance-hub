import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, Dimensions, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Shield, Mail, Lock, User, CheckCircle2, ChevronLeft, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { encode as btoa } from 'base-64';
import emailjs from '@emailjs/react-native';
import { HERO_THEMES } from '../lib/heroThemes';
import { HeroIcon } from '../components/HeroIcon';
import { Footer } from '../components/Footer';

const { width, height } = Dimensions.get('window');

// EmailJS Keys from Web App
const SERVICE_ID = "service_1h4yuhs";
const TEMPLATE_ID = "template_w1besyj";
const PUBLIC_KEY = "YTfjHUjLYl4bFBbUd";

export default function SignupScreen() {
  const [step, setStep] = useState(1); // 1: Email/Pass, 2: OTP, 3: Profile
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [selectedHero, setSelectedHero] = useState('cap');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async () => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !password) {
      Alert.alert('Error', 'Please enter email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // Check if user exists
      const userSnap = await getDoc(doc(db, 'public_users', cleanEmail));
      if (userSnap.exists()) {
        Alert.alert('Error', 'An account with this email already exists.');
        setIsLoading(false);
        return;
      }

      // Generate OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);

      // Send Email
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        { to_email: cleanEmail, otp_code: code, to_name: cleanEmail.split('@')[0] },
        { publicKey: PUBLIC_KEY }
      );

      setStep(2);
    } catch (error: any) {
      console.error('Signup Error:', error);
      Alert.alert('Error', 'Failed to send verification email. ' + (error.text || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
      setStep(3);
    } else {
      Alert.alert('Error', 'Invalid verification code.');
    }
  };

  const handleCompleteSignup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name.');
      return;
    }

    setIsLoading(true);
    const cleanEmail = email.toLowerCase().trim();
    const newUser = {
      email: cleanEmail,
      name: name.trim(),
      heroId: selectedHero,
      password: btoa(password)
    };

    try {
      await setDoc(doc(db, 'public_users', cleanEmail), newUser);
      await AsyncStorage.setItem('financehub_user_email', cleanEmail);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex1}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
              <ChevronLeft size={28} color="#0f172a" />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Shield size={32} color="white" />
              </View>
              <Text style={styles.title}>
                {step === 1 ? 'Join the Initiative' : step === 2 ? 'Verify Email' : 'Personalize'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 1 ? 'Start your financial journey with hero-grade security.' : 
                 step === 2 ? `We sent a code to ${email}` : 
                 'Choose your hero and set your profile name.'}
              </Text>
            </View>

            <View style={styles.form}>
              {step === 1 && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput 
                      style={styles.input} placeholder="name@gmail.com" 
                      placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail}
                      autoCapitalize="none" keyboardType="email-address"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput 
                      style={styles.input} placeholder="••••••••" 
                      placeholderTextColor="#94a3b8" value={password} onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleSendOtp} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Get Verification Code</Text>}
                  </TouchableOpacity>
                </>
              )}

              {step === 2 && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>6-Digit Code</Text>
                    <TextInput 
                      style={[styles.input, styles.otpInput]} placeholder="000000" 
                      placeholderTextColor="#94a3b8" value={otp} onChangeText={setOtp}
                      keyboardType="number-pad" maxLength={6}
                    />
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyOtp}>
                    <Text style={styles.buttonText}>Confirm Code</Text>
                  </TouchableOpacity>
                </>
              )}

              {step === 3 && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Your Name</Text>
                    <TextInput 
                      style={styles.input} placeholder="e.g. Tony Stark" 
                      placeholderTextColor="#94a3b8" value={name} onChangeText={setName}
                    />
                  </View>
                  
                  <Text style={styles.label}>Choose Your Hero</Text>
                  <View style={styles.heroGrid}>
                    {Object.keys(HERO_THEMES).map((heroId) => {
                      const isSelected = selectedHero === heroId;
                      const heroColor = HERO_THEMES[heroId].primary;
                      return (
                        <TouchableOpacity 
                          key={heroId} 
                          style={[
                            styles.heroWrapper,
                            isSelected && { transform: [{ scale: 1.2 }], zIndex: 10 }
                          ]}
                          onPress={() => setSelectedHero(heroId)}
                        >
                          <View style={[
                            styles.heroRing,
                            isSelected && { borderColor: heroColor, borderWidth: 3, shadowColor: heroColor, shadowOpacity: 0.6, shadowRadius: 10, elevation: 15 }
                          ]}>
                            <HeroIcon heroId={heroId} size={48} grayscale={!isSelected} />
                          </View>
                          <Text style={[styles.heroLabel, isSelected && { color: '#0f172a', fontWeight: '900' }]}>
                            {heroId.charAt(0).toUpperCase() + heroId.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity style={styles.primaryButton} onPress={handleCompleteSignup} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Complete Setup</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
            <Footer />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  safeArea: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  backButton: { marginBottom: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  blob1: { position: 'absolute', top: -height * 0.1, left: -width * 0.2, width: width, height: width, backgroundColor: 'rgba(37, 99, 235, 0.08)', borderRadius: width / 2 },
  blob2: { position: 'absolute', bottom: -height * 0.1, right: -width * 0.2, width: width, height: width, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: width / 2 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { width: 64, height: 64, backgroundColor: '#2563eb', borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '900', color: '#0f172a' },
  subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', marginTop: 8, fontWeight: '500', lineHeight: 22 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '800', color: '#475569', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, padding: 16, fontSize: 16, fontWeight: '600', color: '#1e293b' },
  otpInput: { textAlign: 'center', letterSpacing: 10, fontSize: 24, paddingVertical: 20 },
  primaryButton: { backgroundColor: '#2563eb', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 12, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '800' },
  heroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center', marginTop: 10, marginBottom: 30 },
  heroWrapper: { alignItems: 'center', width: (width - 100) / 3 },
  heroRing: { padding: 4, borderRadius: 32, backgroundColor: 'white', borderWidth: 2, borderColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  heroLabel: { fontSize: 11, color: '#94a3b8', marginTop: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  heroText: { fontSize: 14, fontWeight: '700', color: '#64748b' }
});
