import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuthStore } from '../../store/authStore';
import { AuthStackParamList } from '../../navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>;
};

export function RegisterScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { register, isLoading, error, clearError } = useAuthStore();

  const handleRegister = async () => {
    setPasswordError('');
    clearError();

    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos.');
      return;
    }
    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }
    const result = await register(name.trim(), email.trim(), password);
    if (result) {
      navigation.navigate('VerifyEmail', { email: result.email });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>7 días gratis, sin tarjeta de crédito</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Nombre"
            placeholder="Tu nombre"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Input
            label="Correo electrónico"
            placeholder="tu@correo.com"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            isPassword
            value={password}
            onChangeText={setPassword}
            error={passwordError}
          />
          <Input
            label="Confirmar contraseña"
            placeholder="Repite tu contraseña"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.terms}>
            Al registrarte aceptas nuestros{' '}
            <Text style={styles.link}>Términos de uso</Text> y{' '}
            <Text style={styles.link}>Política de privacidad</Text>
          </Text>

          <Button
            title="Crear cuenta"
            onPress={handleRegister}
            isLoading={isLoading}
            style={styles.btn}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.loginLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.secondary },
  subtitle: { fontSize: 15, color: Colors.text.secondary, marginTop: 4 },
  form: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  btn: { marginTop: 8 },
  terms: { fontSize: 12, color: Colors.text.secondary, textAlign: 'center', marginBottom: 16 },
  link: { color: Colors.primary, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginText: { color: Colors.text.secondary, fontSize: 14 },
  loginLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  errorText: { color: Colors.error, fontSize: 14, marginBottom: 12 },
});
