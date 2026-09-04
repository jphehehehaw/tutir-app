import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BANCO_EXERCIOS,
  Exercicio,
  MAPA_MATERIAS,
} from '../../data/exercicios';


const DISCIPLINAS = [
  'Matemática A',
  'Português',
  'Prog I',
  'Álgebra Linear',
  'Cálculo I',
  'ITI',
];

export default function ExerciciosScreen() {
  const [selectedDisciplina, setSelectedDisciplina] = useState<string>('Matemática A');
  const [selectedMateria, setSelectedMateria] = useState<string>('Todas as Matérias');
  const [selectedNivel, setSelectedNivel] = useState<string>('Todos');
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const [image, setImage] = useState<string | null>(null);
  const [xp, setXp] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [statusResultado, setStatusResultado] = useState<'correto' | 'parcial' | 'incorreto' | null>(null);

  // Determinar Nível do Utilizador com base no XP total acumulado
  const getNivelUtilizador = () => {
    if (xp >= 1500) return 'Avançado 🥇';
    if (xp >= 500) return 'Intermédio 🥈';
    return 'Iniciante 🥉';
  };

  // Filtragem dos exercícios por Disciplina, Matéria e Nível
  const exerciciosFiltrados = BANCO_EXERCIOS.filter((ex) => {
    const matchDisc = ex.disciplina === selectedDisciplina;
    const matchMat = selectedMateria === 'Todas as Matérias' || ex.materia === selectedMateria;
    const matchNivel = selectedNivel === 'Todos' || ex.nivel === selectedNivel;
    return matchDisc && matchMat && matchNivel;
  });

  const currentExercicio: Exercicio | undefined = exerciciosFiltrados[currentIndex] || exerciciosFiltrados[0];

  const mudarDisciplina = (disc: string) => {
    setSelectedDisciplina(disc);
    setSelectedMateria('Todas as Matérias');
    setSelectedNivel('Todos');
    setCurrentIndex(0);
    resetState();
  };

  const mudarMateria = (mat: string) => {
    setSelectedMateria(mat);
    setCurrentIndex(0);
    resetState();
  };

  const mudarNivelDificuldade = (niv: string) => {
    setSelectedNivel(niv);
    setCurrentIndex(0);
    resetState();
  };

  const resetState = () => {
    setImage(null);
    setFeedback(null);
    setStatusResultado(null);
  };

  const proximoExercicio = () => {
    resetState();
    setCurrentIndex((prev) => (prev + 1) % (exerciciosFiltrados.length || 1));
  };

  const analisarComIA = async (base64Data: string) => {
    if (!currentExercicio) return;

    setIsAnalyzing(true);
    setFeedback(null);
    setStatusResultado(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const promptText = `Analisa a resolução apresentada na imagem para o exercício de ${currentExercicio.disciplina} -> Tópico: ${currentExercicio.materia} (${currentExercicio.nivel}):
Enunciado: "${currentExercicio.enunciado}".

Responde EXCLUSIVAMENTE num objeto JSON válido com a seguinte estrutura:
{
  "status": "correto" | "parcial" | "incorreto",
  "mensagem": "Explicação objetiva em português. Se estiver parcialmente correto, indica exatamente o que está certo, onde errou ou o que faltou completar."
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY.trim()}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: promptText },
                { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
              ],
            },
          ],
          generationConfig: { response_mime_type: 'application/json' },
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || `Erro HTTP ${response.status}`);
      }

      const rawText = data.candidates[0].content.parts[0].text;
      const conteudo = JSON.parse(rawText);

      const status: 'correto' | 'parcial' | 'incorreto' =
        conteudo.status || (conteudo.correto ? 'correto' : 'incorreto');

      setStatusResultado(status);
      setFeedback(conteudo.mensagem);

      // Atribuição de XP proporcional
      if (status === 'correto') {
        setXp((prev) => prev + currentExercicio.xpRecompensa);
      } else if (status === 'parcial') {
        setXp((prev) => prev + Math.round(currentExercicio.xpRecompensa / 2));
      }
    } catch (error: any) {
      console.error(error);
      setFeedback(`Erro na verificação: ${error.message || 'Falha ao ligar ao servidor'}`);
      setStatusResultado('incorreto');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Acesso à galeria é obrigatório.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.4,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setImage(result.assets[0].uri);
      await analisarComIA(result.assets[0].base64);
    }
  };

  const materiasDisponiveis = MAPA_MATERIAS[selectedDisciplina] || ['Todas as Matérias'];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Exercícios Propostos</Text>

      {/* Cartão do Perfil / XP */}
      <View style={styles.userCard}>
        <Text style={styles.xpText}>⭐ Total: {xp} XP</Text>
        <Text style={styles.levelText}>Nível: {getNivelUtilizador()}</Text>
      </View>

      {/* Seletor 1: Disciplina */}
      <Text style={styles.sectionTitle}>1. Escolhe a Disciplina:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {DISCIPLINAS.map((disc) => (
          <TouchableOpacity
            key={disc}
            style={[styles.chip, selectedDisciplina === disc && styles.chipActive]}
            onPress={() => mudarDisciplina(disc)}
          >
            <Text style={[styles.chipText, selectedDisciplina === disc && styles.chipTextActive]}>
              {disc}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Seletor 2: Matéria / Tópico */}
      <Text style={styles.sectionTitle}>2. Escolhe a Matéria:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
        {materiasDisponiveis.map((mat) => (
          <TouchableOpacity
            key={mat}
            style={[styles.chip, selectedMateria === mat && styles.chipActiveMateria]}
            onPress={() => mudarMateria(mat)}
          >
            <Text style={[styles.chipText, selectedMateria === mat && styles.chipTextActive]}>
              {mat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Seletor 3: Dificuldade */}
      <Text style={styles.sectionTitle}>3. Nível de Dificuldade:</Text>
      <View style={styles.nivelContainer}>
        {['Todos', 'Fácil', 'Médio', 'Difícil'].map((niv) => (
          <TouchableOpacity
            key={niv}
            style={[styles.nivelChip, selectedNivel === niv && styles.nivelChipActive]}
            onPress={() => mudarNivelDificuldade(niv)}
          >
            <Text style={[styles.nivelChipText, selectedNivel === niv && styles.chipTextActive]}>
              {niv}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Exercício Atual */}
      {currentExercicio ? (
        <View style={styles.exerciseCard}>
          <View style={styles.badgeRow}>
            <Text style={styles.badgeMateria}>{currentExercicio.materia}</Text>
            <Text
              style={[
                styles.badgeNivel,
                currentExercicio.nivel === 'Fácil' && { backgroundColor: '#4CAF50' },
                currentExercicio.nivel === 'Médio' && { backgroundColor: '#FF9800' },
                currentExercicio.nivel === 'Difícil' && { backgroundColor: '#F44336' },
              ]}
            >
              {currentExercicio.nivel} (+{currentExercicio.xpRecompensa} XP)
            </Text>
          </View>

          <Text style={styles.exerciseLabel}>
            Exercício {currentIndex + 1} de {exerciciosFiltrados.length}:
          </Text>
          <Text style={styles.exerciseText}>{currentExercicio.enunciado}</Text>

          <TouchableOpacity style={styles.nextButton} onPress={proximoExercicio}>
            <Text style={styles.nextButtonText}>🔄 Próximo Exercício</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Nenhum exercício encontrado para estes filtros. Tenta mudar a matéria ou a dificuldade!
          </Text>
        </View>
      )}

      {/* Botão de Enviar Resolução */}
      <TouchableOpacity
        style={[styles.button, (!currentExercicio || isAnalyzing) && styles.buttonDisabled]}
        onPress={pickImage}
        disabled={!currentExercicio || isAnalyzing}
      >
        <Text style={styles.buttonText}>
          {isAnalyzing ? 'A verificar resolução...' : '📷 Enviar Foto da Resolução'}
        </Text>
      </TouchableOpacity>

      {/* Loader */}
      {isAnalyzing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>O Gemini está a avaliar a resolução...</Text>
        </View>
      )}

      {/* Imagem Carregada */}
      {image && !isAnalyzing && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: image }} style={styles.imagePreview} />
        </View>
      )}

      {/* Feedback do Gemini */}
      {feedback && !isAnalyzing && (
        <View
          style={[
            styles.feedbackCard,
            statusResultado === 'correto' && styles.feedbackSuccess,
            statusResultado === 'parcial' && styles.feedbackWarning,
            statusResultado === 'incorreto' && styles.feedbackError,
          ]}
        >
          <Text style={styles.feedbackTitle}>
            {statusResultado === 'correto' && `✅ Excelente! Resolução Correta (+${currentExercicio?.xpRecompensa} XP)`}
            {statusResultado === 'parcial' && `⚠️ Quase lá! Resolução Parcial (+${Math.round((currentExercicio?.xpRecompensa || 0) / 2)} XP)`}
            {statusResultado === 'incorreto' && '❌ Resolução Incorreta'}
          </Text>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, alignItems: 'center', backgroundColor: '#F8F9FA', flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#1C1C1E' },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFD700',
    width: '100%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  xpText: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  levelText: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#666', alignSelf: 'flex-start', marginBottom: 6 },
  horizontalScroll: { flexDirection: 'row', marginBottom: 12, width: '100%' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#E5E5EA', marginRight: 8, height: 32 },
  chipActive: { backgroundColor: '#007AFF' },
  chipActiveMateria: { backgroundColor: '#34C759' },
  chipText: { fontSize: 13, color: '#333', fontWeight: '500' },
  chipTextActive: { color: '#FFF' },
  nivelContainer: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 15 },
  nivelChip: { flex: 1, paddingVertical: 6, borderRadius: 8, backgroundColor: '#E5E5EA', alignItems: 'center', marginHorizontal: 2 },
  nivelChipActive: { backgroundColor: '#5856D6' },
  nivelChipText: { fontSize: 12, fontWeight: '600', color: '#333' },
  exerciseCard: { backgroundColor: '#FFFFFF', width: '100%', padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#E5E5EA' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  badgeMateria: { fontSize: 12, color: '#007AFF', fontWeight: 'bold', textTransform: 'uppercase' },
  badgeNivel: { fontSize: 11, color: '#FFF', fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden' },
  exerciseLabel: { fontSize: 13, color: '#8E8E93', fontWeight: '600', marginBottom: 4 },
  exerciseText: { fontSize: 16, color: '#1C1C1E', fontWeight: '500', lineHeight: 22 },
  nextButton: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F2F2F7', borderRadius: 8, alignSelf: 'flex-start' },
  nextButtonText: { fontSize: 14, color: '#007AFF', fontWeight: '600' },
  emptyCard: { backgroundColor: '#FFF', width: '100%', padding: 20, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  emptyText: { color: '#8E8E93', textAlign: 'center', fontSize: 14 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10, width: '100%', alignItems: 'center', marginBottom: 20 },
  buttonDisabled: { backgroundColor: '#A2C8FF' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loadingContainer: { marginVertical: 20, alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#666', fontSize: 14 },
  previewContainer: { width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  feedbackCard: { width: '100%', padding: 16, borderRadius: 12, marginTop: 10 },
  feedbackSuccess: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50', borderWidth: 1 },
  feedbackWarning: { backgroundColor: '#FFFDE7', borderColor: '#FBC02D', borderWidth: 1 },
  feedbackError: { backgroundColor: '#FFEBEE', borderColor: '#EF5350', borderWidth: 1 },
  feedbackTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: '#1C1C1E' },
  feedbackText: { fontSize: 14, color: '#333', lineHeight: 20 },
});