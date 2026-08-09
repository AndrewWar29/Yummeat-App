import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useRecipeStore } from '../../store/recipeStore';
import { Button } from '../../components/common/Button';
import { Recipe } from '../../types';

const MAX_PHOTOS = 5;

interface PickedImage {
  uri: string;
  base64: string;
}

export function ScanScreen({ navigation }: any) {
  const { scanFridge, scanResult, isScanLoading, error, clearScanResult } = useRecipeStore();
  const [images, setImages] = useState<PickedImage[]>([]);

  const requestPermission = async (fromCamera: boolean) => {
    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permiso requerido',
        `Necesitamos acceso a tu ${fromCamera ? 'cámara' : 'galería'} para analizar los ingredientes.`
      );
      return false;
    }
    return true;
  };

  const addFromCamera = async () => {
    if (images.length >= MAX_PHOTOS) {
      Alert.alert('Máximo alcanzado', `Puedes analizar hasta ${MAX_PHOTOS} fotos a la vez.`);
      return;
    }
    if (!(await requestPermission(true))) return;

    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]?.base64) {
      const asset = result.assets[0];
      setImages((prev) => [...prev, { uri: asset.uri, base64: asset.base64! }]);
    }
  };

  const addFromGallery = async () => {
    if (images.length >= MAX_PHOTOS) {
      Alert.alert('Máximo alcanzado', `Puedes analizar hasta ${MAX_PHOTOS} fotos a la vez.`);
      return;
    }
    if (!(await requestPermission(false))) return;

    const remaining = MAX_PHOTOS - images.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      base64: true,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });

    if (!result.canceled) {
      const picked = result.assets
        .filter((asset) => asset.base64)
        .slice(0, remaining)
        .map((asset) => ({ uri: asset.uri, base64: asset.base64! }));
      setImages((prev) => [...prev, ...picked]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = () => {
    if (images.length === 0) return;
    clearScanResult();
    scanFridge(images.map((img) => img.base64));
  };

  const handleReset = () => {
    setImages([]);
    clearScanResult();
  };

  const handleUseRecipe = (recipe: Recipe) => {
    navigation.navigate('Recipes', { screen: 'RecipeDetail', params: { recipe, pickMode: true } });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Scan & Cook</Text>
      <Text style={styles.subtitle}>
        Fotografía tu refrigerador (hasta {MAX_PHOTOS} fotos) y la IA te sugerirá 3 recetas con lo que tienes.
      </Text>

      {images.length === 0 && !isScanLoading && !scanResult && (
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionCard} onPress={addFromCamera}>
            <Text style={styles.optionIcon}>📸</Text>
            <Text style={styles.optionTitle}>Tomar foto</Text>
            <Text style={styles.optionSubtitle}>Abre la cámara</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.optionCard} onPress={addFromGallery}>
            <Text style={styles.optionIcon}>🖼️</Text>
            <Text style={styles.optionTitle}>Desde galería</Text>
            <Text style={styles.optionSubtitle}>Elige hasta {MAX_PHOTOS} fotos</Text>
          </TouchableOpacity>
        </View>
      )}

      {images.length > 0 && !isScanLoading && !scanResult && (
        <>
          <View style={styles.thumbGrid}>
            {images.map((img, i) => (
              <View key={img.uri + i} style={styles.thumbWrapper}>
                <Image source={{ uri: img.uri }} style={styles.thumb} />
                <TouchableOpacity style={styles.thumbRemove} onPress={() => removeImage(i)}>
                  <Text style={styles.thumbRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {images.length < MAX_PHOTOS && (
            <View style={styles.addMoreRow}>
              <TouchableOpacity style={styles.addMoreBtn} onPress={addFromCamera}>
                <Text style={styles.addMoreText}>📸 Agregar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addMoreBtn} onPress={addFromGallery}>
                <Text style={styles.addMoreText}>🖼️ Agregar de galería</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.countLabel}>
            {images.length} de {MAX_PHOTOS} fotos
          </Text>

          <Button title="Analizar fotos" onPress={handleAnalyze} style={styles.analyzeBtn} />
          <Button title="Cancelar" onPress={handleReset} variant="outline" style={styles.cancelBtn} />
        </>
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
            onPress={handleReset}
            variant="outline"
            style={styles.rescanBtn}
          />
        </>
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
  thumbGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  thumbWrapper: { position: 'relative' },
  thumb: { width: 88, height: 88, borderRadius: 12, backgroundColor: Colors.gray[200] },
  thumbRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: { color: Colors.white, fontSize: 12, fontWeight: '700' },
  addMoreRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  addMoreBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.gray[300],
    borderStyle: 'dashed',
    paddingVertical: 12,
    alignItems: 'center',
  },
  addMoreText: { fontSize: 13, color: Colors.text.secondary, fontWeight: '500' },
  countLabel: { fontSize: 12, color: Colors.text.secondary, marginBottom: 16, textAlign: 'center' },
  analyzeBtn: { marginBottom: 10 },
  cancelBtn: {},
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
