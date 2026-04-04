import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useRecipeStore } from '../../store/recipeStore';
import { Button } from '../../components/common/Button';
import { Recipe } from '../../types';

export function ScanScreen({ navigation }: any) {
  const { scanFridge, scanResult, isScanLoading, error, clearScanResult } = useRecipeStore();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const pickImage = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permiso requerido',
        `Necesitamos acceso a tu ${fromCamera ? 'cámara' : 'galería'} para analizar los ingredientes.`
      );
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7 });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      clearScanResult();
      if (asset.base64) {
        await scanFridge(asset.base64);
      }
    }
  };

  const handleUseRecipe = (recipe: Recipe) => {
    navigation.navigate('Recipes', { screen: 'RecipeDetail', params: { recipe, pickMode: true } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Scan & Cook</Text>
      <Text style={styles.subtitle}>
        Fotografía tu refrigerador y la IA te sugerirá 3 recetas con lo que tienes.
      </Text>

      {!imageUri && !isScanLoading && !scanResult && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionCard} onPress={() => pickImage(true)}>
            <Text style={styles.optionIcon}>📸</Text>
            <Text style={styles.optionTitle}>Tomar foto</Text>
            <Text style={styles.optionSubtitle}>Abre la cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={() => pickImage(false)}>
            <Text style={styles.optionIcon}>🖼️</Text>
            <Text style={styles.optionTitle}>Desde galería</Text>
            <Text style={styles.optionSubtitle}>Elige una foto</Text>
          </TouchableOpacity>
        </View>
      )}

      {isScanLoading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Analizando tu refrigerador...</Text>
          <Text style={styles.loadingSubtext}>La IA está identificando los ingredientes</Text>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {scanResult && (
        <>
          <View style={styles.detectedBox}>
            <Text style={styles.sectionTitle}>Ingredientes detectados</Text>
            <View style={styles.ingredientChips}>
              {scanResult.detectedIngredients.map((ing) => (
                <View key={ing} style={styles.chip}>
                  <Text style={styles.chipText}>{ing}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>Recetas sugeridas</Text>
          {scanResult.suggestedRecipes.map((recipe, i) => (
            <TouchableOpacity
              key={i}
              style={styles.recipeCard}
              onPress={() => handleUseRecipe(recipe)}
            >
              <View style={styles.recipeCardHeader}>
                <Text style={styles.recipeCardName}>{recipe.name}</Text>
                <Text style={styles.recipeCardTime}>⏱ {recipe.estimatedMinutes} min</Text>
              </View>
              <Text style={styles.recipeCardIngredients}>
                {recipe.ingredients.slice(0, 4).map((i) => i.name).join(', ')}
                {recipe.ingredients.length > 4 ? '...' : ''}
              </Text>
              <Text style={styles.recipeCardCta}>Ver receta →</Text>
            </TouchableOpacity>
          ))}

          <Button
            title="Escanear de nuevo"
            onPress={() => { setImageUri(null); clearScanResult(); }}
            variant="outline"
            style={styles.rescanBtn}
          />
        </>
      )}

      {imageUri && !isScanLoading && !scanResult && (
        <Button
          title="Analizar otra foto"
          onPress={() => { setImageUri(null); clearScanResult(); }}
          variant="outline"
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.secondary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.text.secondary, marginBottom: 28, lineHeight: 20 },
  optionsContainer: { flexDirection: 'row', gap: 12 },
  optionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIcon: { fontSize: 40, marginBottom: 12 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: Colors.secondary },
  optionSubtitle: { fontSize: 12, color: Colors.text.secondary, marginTop: 4 },
  loadingBox: { alignItems: 'center', paddingVertical: 48 },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '600', color: Colors.secondary },
  loadingSubtext: { marginTop: 6, fontSize: 13, color: Colors.text.secondary },
  error: { color: Colors.error, textAlign: 'center', marginVertical: 16 },
  detectedBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.secondary, marginBottom: 12 },
  ingredientChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  recipeCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
  recipeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  recipeCardName: { fontSize: 16, fontWeight: '700', color: Colors.secondary, flex: 1 },
  recipeCardTime: { fontSize: 13, color: Colors.primary },
  recipeCardIngredients: { fontSize: 13, color: Colors.text.secondary, marginBottom: 8 },
  recipeCardCta: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  rescanBtn: { marginTop: 16 },
});
