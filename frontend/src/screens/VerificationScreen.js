import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme/theme';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';

const VerificationScreen = ({ navigation }) => {
  const [code, setCode] = useState(['', '', '', '']);
  const inputs = useRef([]);

  const handleCodeChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 3) {
      inputs.current[index + 1].focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color="black" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Enter Your Verification Code</Text>

        <View style={[styles.icon, { justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialCommunityIcons name="message-lock" size={100} color={COLORS.primary} />
        </View>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputs.current[index] = ref)}
              style={styles.codeInput}
              value={digit}
              onChangeText={text => handleCodeChange(text, index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
            />
          ))}
        </View>

        <Text style={styles.infoText}>
          We sent a four digit verification code to your email{"\n"}
          <Text style={styles.emailText}>jane******@gmail.com</Text>
        </Text>

        <Button
          title="Verify"
          onPress={() => navigation.navigate('ProfileSetup')}
          style={styles.verifyButton}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Didn't receive code? </Text>
          <TouchableOpacity>
            <Text style={styles.resendText}>Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  backButton: {
    padding: SPACING.md,
    marginTop: SPACING.sm,
    width: 60,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
  },
  title: {
    ...TYPOGRAPHY.h2,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  icon: {
    width: 150,
    height: 150,
    marginBottom: SPACING.xl,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
  },
  codeInput: {
    width: 65,
    height: 65,
    backgroundColor: '#EAEAEA',
    borderRadius: RADIUS.md,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginBottom: SPACING.xxl,
  },
  emailText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  verifyButton: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    marginTop: SPACING.xl,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: '#666',
  },
  resendText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default VerificationScreen;
