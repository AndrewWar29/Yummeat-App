import React, { useState } from 'react';
import { View, Text, StyleSheet, Share, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useHouseholdStore } from '../../store/householdStore';

export function CreateHouseholdScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const { createHousehold, household, isLoading, error } = useHouseholdStore();
  const [created, setCreated] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'Ingresa el nombre del hogar.');
      return;
    }
    await createHousehold(name.trim());
    setCreated(true);
  };

  const handleShare = async () => {
    if (!household) return;
    await Share.share({
      message: `Únete a nuestro hogar en Yummeat con el código: ${household.inviteCode}`,
    });
  };

  if (created && household) {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🎉</Text>
        <Text style={styles.title}>¡Hogar creado!</Text>
        <Text style={styles.householdName}>{household.name}</Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Código de invitación</Text>
          <Text style={styles.code}>{household.inviteCode}</Text>
          <Text style={styles.codeHint}>Compártelo para que tu familia se una</Text>
        </View>

        <Button title="Compartir código" onPress={handleShare} style={styles.btn} />
        <Button
          title="Ir al inicio"
          onPress={() => navigation.replace('AppTabs')}
          variant="outline"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🏠</Text>
      <Text style={styles.title}>Nuevo Hogar</Text>
      <Text style={styles.subtitle}>¿Cómo se llama tu hogar?</Text>

      <Input
        label="Nombre del hogar"
        placeholder="Ej: Familia García"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        title="Crear hogar"
        onPress={handleCreate}
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
  householdName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  codeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  codeLabel: { fontSize: 13, color: Colors.text.secondary, marginBottom: 8 },
  code: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 6,
  },
  codeHint: { fontSize: 12, color: Colors.text.secondary, marginTop: 8 },
  btn: { marginBottom: 12 },
  error: { color: Colors.error, fontSize: 14, marginBottom: 12 },
});
