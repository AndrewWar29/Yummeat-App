import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'VerifyEmail'>;
  route: any;
};

export function VerifyEmailScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputs = useRef<TextInput[]>([]);
  const { verifyEmail, resendCode, isLoading, error, clearError } = useAuthStore();

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length < 6) {
      Alert.alert('Código incompleto', 'Ingresa los 6 dígitos del código.');
      return;
    }
    clearError();
    await verifyEmail(email, fullCode);
  };

  const handleResend = async () => {
    clearError();
    await resendCode(email);
    Alert.alert('Código enviado', 'Revisa tu correo, enviamos un nuevo código.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.icon}>📬</Text>
        <Text style={styles.title}>Verifica tu correo</Text>
        <Text style={styles.subtitle}>
          Enviamos un código de 6 dígitos a{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        <View style={styles.codeRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => { if (ref) inputs.current[i] = ref; }}
              style={[styles.codeInput, digit ? styles.codeInputFilled : undefined]}
              value={digit}
              onChangeText={(t) => handleChange(t.replace(/[^0-9]/g, ''), i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button
          title="Verificar cuenta"
          onPress={handleVerify}
          isLoading={isLoading}
          style={styles.btn}
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>¿No recibiste el código? </Text>
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Reenviar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Cambiar correo</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  email: { fontWeight: '700', color: Colors.secondary },
  codeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    backgroundColor: Colors.white,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary,
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  btn: { width: '100%', marginBottom: 20 },
  resendRow: { flexDirection: 'row', alignItems: 'center' },
  resendText: { fontSize: 14, color: Colors.text.secondary },
  resendLink: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  backBtn: { marginTop: 16 },
  backText: { fontSize: 14, color: Colors.text.secondary, textDecorationLine: 'underline' },
  error: { color: Colors.error, fontSize: 14, marginBottom: 16, textAlign: 'center' },
});
