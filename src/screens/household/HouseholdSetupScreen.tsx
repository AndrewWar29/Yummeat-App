import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Button } from '../../components/common/Button';

export function HouseholdSetupScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🏠</Text>
      <Text style={styles.title}>Configura tu Hogar</Text>
      <Text style={styles.subtitle}>
        Crea un hogar nuevo o únete a uno existente con un código de invitación.
      </Text>

      <View style={styles.btnGroup}>
        <Button
          title="Crear un hogar"
          onPress={() => navigation.navigate('CreateHousehold')}
          style={styles.btn}
        />
        <Button
          title="Unirme con código"
          onPress={() => navigation.navigate('JoinHousehold')}
          variant="outline"
          style={styles.btn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 72, marginBottom: 24 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  btnGroup: { width: '100%', gap: 12 },
  btn: { width: '100%' },
});
