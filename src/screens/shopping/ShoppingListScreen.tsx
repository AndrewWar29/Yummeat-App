import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useHouseholdStore } from '../../store/householdStore';
import { ShoppingItem } from '../../types';
import { getWeekStart } from '../../utils/dateUtils';

export function ShoppingListScreen() {
  const { shoppingList, loadShoppingList, toggleShoppingItem, isLoading } = useHouseholdStore();
  const weekStart = getWeekStart();

  useEffect(() => {
    loadShoppingList(weekStart);
  }, []);

  const pending = shoppingList.filter((i) => !i.checked);
  const checked = shoppingList.filter((i) => i.checked);

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity
      style={[styles.item, item.checked && styles.itemChecked]}
      onPress={() => toggleShoppingItem(item.name)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
          {item.name}
        </Text>
        <Text style={styles.itemQty}>
          {item.totalQuantity} {item.unit}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={styles.loadingText}>Consolidando ingredientes...</Text>
      </View>
    );
  }

  if (shoppingList.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Lista vacía</Text>
        <Text style={styles.emptySubtitle}>
          Agrega recetas al calendario semanal para generar tu lista de compras.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lista de la semana</Text>
        <Text style={styles.progress}>
          {checked.length}/{shoppingList.length} completados
        </Text>
      </View>

      <FlatList
        data={[...pending, ...checked]}
        keyExtractor={(item) => item.name}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadShoppingList(weekStart)}
            tintColor={Colors.primary}
          />
        }
        ListFooterComponent={
          checked.length > 0 ? (
            <Text style={styles.checkedLabel}>
              {checked.length} artículo{checked.length > 1 ? 's' : ''} comprado
              {checked.length > 1 ? 's' : ''}
            </Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 8,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.secondary },
  progress: { fontSize: 14, color: Colors.text.secondary },
  list: { padding: 16, paddingBottom: 40 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    gap: 14,
  },
  itemChecked: { opacity: 0.5 },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: Colors.success, borderColor: Colors.success },
  checkmark: { color: Colors.white, fontSize: 14, fontWeight: '700' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '500', color: Colors.text.primary },
  itemNameChecked: { textDecorationLine: 'line-through' },
  itemQty: { fontSize: 13, color: Colors.text.secondary, marginTop: 2 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: Colors.background,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.secondary, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingText: { marginTop: 12, color: Colors.text.secondary },
  checkedLabel: {
    textAlign: 'center',
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 8,
  },
});
