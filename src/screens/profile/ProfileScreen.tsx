import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { useHouseholdStore } from '../../store/householdStore';
import { Button } from '../../components/common/Button';
import { trialDaysRemaining } from '../../utils/dateUtils';
import { Config } from '../../constants/config';

export function ProfileScreen({ navigation }: any) {
  const { user, logout, isOnTrial, hasActiveSubscription } = useAuthStore();
  const { household, removeMember, regenerateInviteCode } = useHouseholdStore();

  const daysLeft = user?.trialStart
    ? trialDaysRemaining(user.trialStart, Config.TRIAL_DAYS)
    : 0;

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: logout },
    ]);
  };

  const handleShareCode = async () => {
    if (!household) return;
    await Share.share({
      message: `Únete a nuestro hogar "${household.name}" en Yummeat con el código: ${household.inviteCode}`,
    });
  };

  const handleRemoveMember = (userId: string, name: string) => {
    Alert.alert('Eliminar miembro', `¿Quitar a ${name} del hogar?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeMember(userId),
      },
    ]);
  };

  const isAdmin = household?.adminId === user?.id;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Subscription status */}
      <View style={[styles.subCard, hasActiveSubscription() ? styles.subActive : styles.subExpired]}>
        {isOnTrial() ? (
          <>
            <Text style={styles.subTitle}>Prueba gratuita</Text>
            <Text style={styles.subDesc}>
              Te quedan <Text style={styles.subHighlight}>{daysLeft} días</Text> de acceso completo.
            </Text>
            <Button
              title="Suscribirme — $20/año"
              onPress={() => Alert.alert('Próximamente', 'El pago estará disponible pronto.')}
              style={styles.subBtn}
            />
          </>
        ) : hasActiveSubscription() ? (
          <>
            <Text style={styles.subTitle}>Suscripción activa</Text>
            <Text style={styles.subDesc}>Tienes acceso completo a Yummeat.</Text>
          </>
        ) : (
          <>
            <Text style={[styles.subTitle, { color: Colors.error }]}>Prueba vencida</Text>
            <Text style={styles.subDesc}>Activa tu suscripción para seguir usando la app.</Text>
            <Button
              title="Activar — $20/año"
              onPress={() => Alert.alert('Próximamente', 'El pago estará disponible pronto.')}
              style={styles.subBtn}
            />
          </>
        )}
      </View>

      {/* Household */}
      {household && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mi Hogar</Text>
          <View style={styles.card}>
            <Text style={styles.householdName}>{household.name}</Text>

            <View style={styles.codeRow}>
              <View>
                <Text style={styles.codeLabel}>Código de invitación</Text>
                <Text style={styles.code}>{household.inviteCode}</Text>
              </View>
              <TouchableOpacity onPress={handleShareCode} style={styles.shareBtn}>
                <Text style={styles.shareBtnText}>Compartir</Text>
              </TouchableOpacity>
            </View>

            {isAdmin && (
              <TouchableOpacity onPress={regenerateInviteCode} style={styles.regenBtn}>
                <Text style={styles.regenText}>Regenerar código</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.membersTitle}>Integrantes</Text>
            {household.members.map((member) => (
              <View key={member.userId} style={styles.memberRow}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{member.name[0].toUpperCase()}</Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberRole}>
                    {member.role === 'admin' ? 'Administrador' : 'Miembro'}
                  </Text>
                </View>
                {isAdmin && member.userId !== user?.id && (
                  <TouchableOpacity
                    onPress={() => handleRemoveMember(member.userId, member.name)}
                  >
                    <Text style={styles.removeText}>Quitar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      <Button title="Cerrar sesión" onPress={handleLogout} variant="outline" style={styles.logoutBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  userCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.white },
  userName: { fontSize: 20, fontWeight: '700', color: Colors.secondary },
  userEmail: { fontSize: 14, color: Colors.text.secondary, marginTop: 4 },
  subCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  subActive: { backgroundColor: Colors.success + '20' },
  subExpired: { backgroundColor: Colors.error + '15' },
  subTitle: { fontSize: 16, fontWeight: '700', color: Colors.secondary, marginBottom: 4 },
  subDesc: { fontSize: 14, color: Colors.text.secondary, lineHeight: 20 },
  subHighlight: { color: Colors.primary, fontWeight: '700' },
  subBtn: { marginTop: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.secondary, marginBottom: 10 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  householdName: { fontSize: 18, fontWeight: '700', color: Colors.secondary, marginBottom: 16 },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.gray[100],
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  codeLabel: { fontSize: 12, color: Colors.text.secondary },
  code: { fontSize: 22, fontWeight: '800', color: Colors.primary, letterSpacing: 4 },
  shareBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  shareBtnText: { color: Colors.white, fontWeight: '600', fontSize: 13 },
  regenBtn: { alignSelf: 'flex-start', marginBottom: 16 },
  regenText: { fontSize: 13, color: Colors.text.secondary, textDecorationLine: 'underline' },
  membersTitle: { fontSize: 14, fontWeight: '600', color: Colors.secondary, marginBottom: 12 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: Colors.primary, fontWeight: '700' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '500', color: Colors.text.primary },
  memberRole: { fontSize: 12, color: Colors.text.secondary },
  removeText: { fontSize: 13, color: Colors.error },
  logoutBtn: { borderColor: Colors.error },
});
