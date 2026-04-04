import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Recipe, MealType } from '../../types';
import { Button } from '../../components/common/Button';
import { useHouseholdStore } from '../../store/householdStore';
import { useRecipeStore } from '../../store/recipeStore';

const MEAL_OPTIONS: { label: string; value: MealType }[] = [
  { label: 'Desayuno', value: 'breakfast' },
  { label: 'Almuerzo', value: 'lunch' },
  { label: 'Cena', value: 'dinner' },
];

export function RecipeDetailScreen({ route, navigation }: any) {
  const recipe: Recipe = route.params?.recipe;
  const pickMode = route.params?.pickMode;
  const preselectedDate = route.params?.date;
  const preselectedMeal: MealType = route.params?.mealType;

  const { addCalendarEntry } = useHouseholdStore();
  const { saveRecipe } = useRecipeStore();
  const [selectedMeal, setSelectedMeal] = useState<MealType>(preselectedMeal ?? 'dinner');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddToCalendar = async () => {
    if (!preselectedDate) {
      Alert.alert('Selecciona un día', 'Regresa al calendario y selecciona el día y comida.');
      return;
    }
    setIsSaving(true);
    let savedRecipe = recipe;
    if (!recipe.id) {
      savedRecipe = (await saveRecipe(recipe)) ?? recipe;
    }
    await addCalendarEntry(savedRecipe, preselectedDate, selectedMeal);
    setIsSaving(false);
    navigation.navigate('Calendar');
  };

  if (!recipe) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.recipeName}>{recipe.name}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>⏱ {recipe.estimatedMinutes} min</Text>
        </View>
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>🥗 {recipe.ingredients.length} ingredientes</Text>
        </View>
        <View style={styles.metaBadge}>
          <Text style={styles.metaText}>📋 {recipe.steps.length} pasos</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Ingredientes</Text>
      {recipe.ingredients.map((ing, i) => (
        <View key={i} style={styles.ingredientRow}>
          <View style={styles.bullet} />
          <Text style={styles.ingredientText}>
            <Text style={styles.ingredientName}>{ing.name}</Text>
            {'  '}
            <Text style={styles.ingredientQty}>
              {ing.quantity} {ing.unit}
            </Text>
          </Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Preparación</Text>
      {recipe.steps.map((step, i) => (
        <View key={i} style={styles.stepRow}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{i + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}

      {pickMode && (
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Agregar al calendario</Text>
          <View style={styles.mealSelector}>
            {MEAL_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.mealOption, selectedMeal === opt.value && styles.mealOptionActive]}
                onPress={() => setSelectedMeal(opt.value)}
              >
                <Text
                  style={[
                    styles.mealOptionText,
                    selectedMeal === opt.value && styles.mealOptionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Button
            title="Agregar al calendario"
            onPress={handleAddToCalendar}
            isLoading={isSaving}
          />
        </View>
      )}

      {!pickMode && (
        <Button
          title="Agregar al calendario"
          onPress={() => navigation.navigate('Calendar')}
          variant="outline"
          style={styles.bottomBtn}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  recipeName: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.secondary,
    marginBottom: 16,
  },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  metaBadge: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 12,
    marginTop: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  ingredientText: { fontSize: 15, color: Colors.text.primary, flex: 1 },
  ingredientName: { fontWeight: '500' },
  ingredientQty: { color: Colors.text.secondary },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: { color: Colors.white, fontWeight: '700', fontSize: 13 },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22, color: Colors.text.primary },
  calendarSection: { marginTop: 24 },
  mealSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  mealOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.gray[300],
    alignItems: 'center',
  },
  mealOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  mealOptionText: { fontSize: 13, color: Colors.text.secondary, fontWeight: '500' },
  mealOptionTextActive: { color: Colors.primary },
  bottomBtn: { marginTop: 32 },
});
