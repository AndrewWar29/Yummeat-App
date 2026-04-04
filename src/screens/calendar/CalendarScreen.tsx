import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useHouseholdStore } from '../../store/householdStore';
import { CalendarEntry, MealType } from '../../types';
import { getWeekStart, getWeekDays, dayLabel, shortDate } from '../../utils/dateUtils';

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '🌅 Desayuno',
  lunch: '☀️ Almuerzo',
  dinner: '🌙 Cena',
};

const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner'];

export function CalendarScreen({ navigation }: any) {
  const { household, calendarEntries, loadCalendar, removeCalendarEntry, isLoading } =
    useHouseholdStore();
  const [weekStart] = useState(getWeekStart());
  const weekDays = getWeekDays(weekStart);

  useEffect(() => {
    loadCalendar(weekStart);
  }, [weekStart]);

  const getEntry = (date: string, mealType: MealType): CalendarEntry | undefined =>
    calendarEntries.find((e) => e.date === date && e.mealType === mealType);

  const handleRemove = (entry: CalendarEntry) => {
    Alert.alert(
      'Eliminar comida',
      `¿Quitar "${entry.recipe.name}" del calendario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => removeCalendarEntry(entry.id),
        },
      ]
    );
  };

  const handleAdd = (date: string, mealType: MealType) => {
    navigation.navigate('Recipes', {
      screen: 'RecipeSearch',
      params: { pickMode: true, date, mealType },
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Semana del {weekStart}</Text>

      {weekDays.map((date) => (
        <View key={date} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayName}>{dayLabel(date)}</Text>
            <Text style={styles.dayDate}>{shortDate(date)}</Text>
          </View>

          {MEALS.map((meal) => {
            const entry = getEntry(date, meal);
            return (
              <View key={meal} style={styles.mealRow}>
                <Text style={styles.mealLabel}>{MEAL_LABELS[meal]}</Text>
                {entry ? (
                  <TouchableOpacity
                    style={styles.recipePill}
                    onLongPress={() => handleRemove(entry)}
                  >
                    <Text style={styles.recipeName} numberOfLines={1}>
                      {entry.recipe.name}
                    </Text>
                    <Text style={styles.recipeUser}>por {entry.userName}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={() => handleAdd(date, meal)}
                  >
                    <Text style={styles.addBtnText}>+ Agregar</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 32 },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 16,
  },
  dayCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
    paddingBottom: 8,
  },
  dayName: { fontSize: 16, fontWeight: '700', color: Colors.secondary },
  dayDate: { fontSize: 14, color: Colors.text.secondary },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  mealLabel: { width: 110, fontSize: 13, color: Colors.text.secondary },
  recipePill: {
    flex: 1,
    backgroundColor: Colors.primary + '15',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recipeName: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  recipeUser: { fontSize: 11, color: Colors.text.secondary },
  addBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.gray[300],
    borderStyle: 'dashed',
    paddingVertical: 6,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 13, color: Colors.text.secondary },
});
