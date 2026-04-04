import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useRecipeStore } from '../../store/recipeStore';
import { useHouseholdStore } from '../../store/householdStore';
import { Button } from '../../components/common/Button';

export function RecipeSearchScreen({ navigation, route }: any) {
  const { pickMode, date, mealType } = route.params ?? {};
  const [query, setQuery] = useState('');
  const { generateRecipe, currentRecipe, isLoading, error, clearError } = useRecipeStore();
  const { addCalendarEntry } = useHouseholdStore();

  const handleSearch = async () => {
    if (!query.trim()) return;
    clearError();
    const recipe = await generateRecipe(query.trim());
    if (recipe) navigation.navigate('RecipeDetail', { recipe });
  };

  const suggestions = [
    'Lasaña', 'Tacos de pollo', 'Sopa de lentejas',
    'Arroz con leche', 'Pasta carbonara', 'Ensalada César',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>¿Qué quieres cocinar?</Text>
        <Text style={styles.subtitle}>
          Escribe el nombre de un plato y la IA generará la receta completa.
        </Text>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Ej: Lasaña boloñesa..."
            placeholderTextColor={Colors.gray[400]}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>→</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>Generando receta con IA...</Text>
          </View>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        {!isLoading && (
          <>
            <Text style={styles.sectionTitle}>Sugerencias populares</Text>
            <View style={styles.chips}>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={styles.chip}
                  onPress={() => {
                    setQuery(s);
                  }}
                >
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.secondary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.text.secondary, marginBottom: 24, lineHeight: 20 },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.gray[300],
    overflow: 'hidden',
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text.primary,
  },
  searchBtn: {
    width: 52,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { fontSize: 22, color: Colors.white, fontWeight: '700' },
  loadingBox: { alignItems: 'center', paddingVertical: 32 },
  loadingText: { marginTop: 12, fontSize: 15, color: Colors.text.secondary },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.secondary, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.gray[300],
  },
  chipText: { fontSize: 14, color: Colors.text.primary },
  error: { color: Colors.error, fontSize: 14, textAlign: 'center', marginBottom: 16 },
});
