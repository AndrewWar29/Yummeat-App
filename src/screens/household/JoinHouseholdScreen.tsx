import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useHouseholdStore } from '../../store/householdStore';

export function JoinHouseholdScreen({ navigation }: any) {
  const [code, setCode] = useState('');
  const { joinHousehold, isLoading, error } = useHouseholdStore();

  const handleJoin = async () => {
    if (code.trim().length === 0) {
      Alert.alert('Campo requerido', 'Ingresa el código de invitación.');
      return;
    }
    await joinHousehold(code.trim().toUpperCase());
    navigation.replace('AppTabs');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🔗</Text>
      <Text style={styles.title}>Unirte a un Hogar</Text>
      <Text style={styles.subtitle}>
        Pídele el código de invitación al administrador del hogar e ingrésalo aquí.
      </Text>

      <Input
        label="Código de invitación"
        placeholder="Ej: AB12CD"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        maxLength={6}
        autoCapitalize="characters"
        style={styles.codeInput}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title="Unirme al hogar"
        onPress={handleJoin}
        isLoading={isLoading}
        style={styles.btn}
      />
      <Button title="Cancelar" onPress={() => navigation.goBack()} variant="ghost" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 24,
    justifyContent: 'center',
  },
  icon: { fontSize: 56, textAlign: 'center', marginBottom: 16 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 8,
  },
  btn: { marginTop: 16, marginBottom: 12 },
  error: { color: Colors.error, fontSize: 14, textAlign: 'center' },
});
