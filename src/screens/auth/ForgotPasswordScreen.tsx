import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuthStore } from '../../store/authStore';

export function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const { forgotPassword, isLoading } = useAuthStore();

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Campo requerido', 'Ingresa tu correo electrónico.');
      return;
    }
    await forgotPassword(email.trim());
    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>📬</Text>
        <Text style={styles.title}>Correo enviado</Text>
        <Text style={styles.description}>
          Revisa tu bandeja de entrada en {email} y sigue las instrucciones para restablecer tu contraseña.
        </Text>
        <Button title="Volver al inicio" onPress={() => navigation.goBack()} style={styles.btn} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.icon}>🔑</Text>
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.description}>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </Text>

        <Input
          label="Correo electrónico"
          placeholder="tu@correo.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Button title="Enviar enlace" onPress={handleSend} isLoading={isLoading} style={styles.btn} />
        <Button title="Volver" onPress={() => navigation.goBack()} variant="ghost" />
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
    backgroundColor: Colors.background,
  },
  icon: { fontSize: 52, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  btn: { marginBottom: 12 },
});
