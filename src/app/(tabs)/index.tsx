import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import 'katex/dist/katex.min.css';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
}

type Subject = 'mat' | 'pt' | 'ei';

const STORAGE_KEY = '@tutor_ia_chat_history';

export default function HomeScreen() {
  const [selectedSubject, setSelectedSubject] = useState<Subject>('mat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Olá! Sou o teu Tutor IA. Seleciona a disciplina no topo e envia a tua dúvida!',
      sender: 'ai',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedMessages = window.localStorage.getItem(`${STORAGE_KEY}_${selectedSubject}`);
        if (savedMessages) {
          const parsed = JSON.parse(savedMessages);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
        setMessages([
          {
            id: '1',
            text: `Olá! Sou o teu Tutor de ${
              selectedSubject === 'mat' ? 'Matemática A' : selectedSubject === 'pt' ? 'Português' : 'Engenharia Informática'
            }. Envia a tua dúvida!`,
            sender: 'ai',
          },
        ]);
      }
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
    }
  }, [selectedSubject]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && messages.length > 0) {
        window.localStorage.setItem(`${STORAGE_KEY}_${selectedSubject}`, JSON.stringify(messages));
      }
    } catch (e) {
      console.error('Erro ao guardar histórico:', e);
    }
  }, [messages, selectedSubject]);

  const handleClearHistory = () => {
    const defaultMsg: Message[] = [
      {
        id: Date.now().toString(),
        text: 'Histórico desta disciplina limpo! Envia a tua dúvida.',
        sender: 'ai',
      },
    ];
    setMessages(defaultMsg);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(`${STORAGE_KEY}_${selectedSubject}`);
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.7,
          base64: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (asset.base64) {
            setSelectedImage(`data:image/jpeg;base64,${asset.base64}`);
          } else if (asset.uri) {
            setSelectedImage(asset.uri);
          }
        }
      } catch (error) {
        console.error("Erro ao selecionar imagem na web:", error);
      }
      return;
    }

    Alert.alert(
      "Enviar Imagem",
      "Escolhe uma opção:",
      [
        {
          text: "Tirar Foto",
          onPress: async () => {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (!permissionResult.granted) {
              alert("Precisamos de permissão para aceder à câmara!");
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.7,
              base64: true,
            });
            if (!result.canceled && result.assets[0].base64) {
              setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
          }
        },
        {
          text: "Escolher da Galeria",
          onPress: async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
              alert("Precisamos de permissão para aceder à galeria!");
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.7,
              base64: true,
            });
            if (!result.canceled && result.assets[0].base64) {
              setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
          }
        },
        {
          text: "Cancelar",
          style: "cancel"
        }
      ]
    );
  };

  const sendMessage = async () => {
    if (!inputText.trim() && !selectedImage) return;

    const userText = inputText;
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText || '[Imagem enviada]',
      sender: 'user',
    };

    const historyToSend = messages.filter((m) => m.id !== '1' && m.text.trim().length > 0);

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    const currentImage = selectedImage;
    setSelectedImage(null);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userText, 
          image: currentImage,
          subject: selectedSubject,
          history: historyToSend 
        }),
      });

      const data = await response.json();
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: data.reply || 'Erro na resposta.',
        sender: 'ai',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `Erro: ${error?.message || 'Falha na ligação ao servidor.'}`,
        sender: 'ai',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Tutor IA 24/7</Text>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearHistory} title="Limpar Histórico">
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Tira as tuas dúvidas instantaneamente</Text>
        
        <View style={styles.subjectSelector}>
          <TouchableOpacity 
            style={[styles.subjectBtn, selectedSubject === 'mat' && styles.subjectBtnActive]}
            onPress={() => setSelectedSubject('mat')}
          >
            <Text style={[styles.subjectBtnText, selectedSubject === 'mat' && styles.subjectBtnTextActive]}>Matemática A</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.subjectBtn, selectedSubject === 'pt' && styles.subjectBtnActive]}
            onPress={() => setSelectedSubject('pt')}
          >
            <Text style={[styles.subjectBtnText, selectedSubject === 'pt' && styles.subjectBtnTextActive]}>Português</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.subjectBtn, selectedSubject === 'ei' && styles.subjectBtnActive]}
            onPress={() => setSelectedSubject('ei')}
          >
            <Text style={[styles.subjectBtnText, selectedSubject === 'ei' && styles.subjectBtnTextActive]}>Eng. Informática</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer} 
        contentContainerStyle={{ paddingVertical: 10 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {msg.sender === 'user' ? (
              <Text style={styles.userText}>{msg.text}</Text>
            ) : (
              <View style={styles.markdownWrapper}>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, className, children, ...props }: any) {
                      return (
                        <code style={inlineCodeStyle} {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre({ children }) {
                      return (
                        <pre style={codeBlockStyle}>
                          {children}
                        </pre>
                      );
                    }
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </View>
            )}
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <ActivityIndicator size="small" color="#007AFF" />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageButton}>
              <Ionicons name="close-circle" size={20} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity onPress={pickImage} style={styles.attachButton}>
            <Ionicons name="image-outline" size={24} color="#007AFF" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Escreve a tua dúvida..."
            value={inputText}
            onChangeText={setInputText}
            editable={!loading}
          />
          
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const codeBlockStyle = {
  backgroundColor: '#1e1e1e',
  color: '#d4d4d4',
  padding: '10px 12px',
  borderRadius: '8px',
  overflowX: 'auto' as const,
  fontSize: '13px',
  fontFamily: 'monospace',
  margin: '8px 0',
};

const inlineCodeStyle = {
  backgroundColor: 'rgba(0,0,0,0.06)',
  padding: '2px 5px',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '13px',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  header: { paddingTop: 45, paddingBottom: 15, backgroundColor: '#007AFF', alignItems: 'center', paddingHorizontal: 15 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  clearBtn: { position: 'absolute', right: 5, padding: 5 },
  headerSubtitle: { fontSize: 12, color: '#e0e0e0', marginTop: 2, marginBottom: 12 },
  subjectSelector: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 3 },
  subjectBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16 },
  subjectBtnActive: { backgroundColor: '#fff' },
  subjectBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  subjectBtnTextActive: { color: '#007AFF' },
  chatContainer: { flex: 1, paddingHorizontal: 15 },
  messageBubble: { maxWidth: '88%', padding: 12, borderRadius: 16, marginBottom: 10 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  aiBubble: { alignSelf: 'flex-start', backgroundColor: '#ffffff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#e0e0e0' },
  userText: { color: '#fff', fontSize: 15 },
  markdownWrapper: { fontSize: 15, color: '#1a1a1a' },
  inputContainer: { padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e5e5' },
  inputRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  attachButton: { padding: 8, justifyContent: 'center', alignItems: 'center', marginRight: 5 },
  imagePreviewContainer: { position: 'relative', marginBottom: 8, alignSelf: 'flex-start' },
  imagePreview: { width: 60, height: 60, borderRadius: 8 },
  removeImageButton: { position: 'absolute', top: -6, right: -6, backgroundColor: '#fff', borderRadius: 10 },
  input: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15, marginRight: 10 },
  sendButton: { backgroundColor: '#007AFF', width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
});