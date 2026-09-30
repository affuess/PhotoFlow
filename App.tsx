import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, FlatList, TextInput, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useOfflineFeed } from './src/hooks/useOfflineFeed';
import { initDatabase } from './src/database/db';

export default function App() {
  const { items, isOffline, saveNote } = useOfflineFeed();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  React.useEffect(() => {
    initDatabase().catch(err => console.error("DB Init Error:", err));
  }, []);

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', 
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFileUri(file.uri);
        setFileName(file.name);
      }
    } catch (err) {
      console.log('Error picking document:', err);
    }
  };

  const handleAdd = () => {
    if (!title) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    saveNote(title, desc, imageUri || undefined, fileUri || undefined, fileName || undefined);
    
    setTitle('');
    setDesc('');
    setImageUri(null);
    setFileUri(null);
    setFileName(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        Status: {isOffline ? '🔴 Offline' : '🟢 Online'}
      </Text>

      <View style={styles.form}>
        <TextInput 
          placeholder="Title" 
          value={title} 
          onChangeText={setTitle} 
          style={styles.input}
        />
        <TextInput 
          placeholder="Description" 
          value={desc} 
          onChangeText={setDesc} 
          style={styles.input}
        />

        <View style={styles.buttonsRow}>
          <TouchableOpacity style={[styles.pickerBtn, { marginRight: 8 }]} onPress={pickImage}>
            <Text>+ Add Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pickerBtn} onPress={pickDocument}>
            <Text>+ Add File</Text>
          </TouchableOpacity>
        </View>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}
        {fileName && (
          <Text style={styles.fileAttachedText}>
            📎 File: {fileName}
          </Text>
        )}

        <Button title="Save Note" onPress={handleAdd} color="#2196F3" />
      </View>

      <Text style={styles.header}>My Notes</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text>{item.description}</Text>
              {item.file_name && (
                <Text style={styles.fileTag}>📎 {item.file_name}</Text>
              )}
              <Text style={styles.sync}>
                Synced: {item.synced ? '✅ Yes' : '❌ No'}
              </Text>
            </View>
            {item.image_uri && <Image source={{ uri: item.image_uri }} style={styles.itemImage} />}
          </View>
        )}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    paddingTop: 60, 
    backgroundColor: '#f5f5f5' 
  },
  status: { 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 10, 
    color: '#666' 
  },
  form: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 20, 
    elevation: 3 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 10, 
    marginBottom: 10, 
    borderRadius: 5, 
    backgroundColor: '#fafafa' 
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pickerBtn: { 
    flex: 1,
    backgroundColor: '#e0e0e0', 
    padding: 10, 
    alignItems: 'center', 
    borderRadius: 5, 
  },
  previewImage: { 
    width: 100, 
    height: 100, 
    marginBottom: 10, 
    borderRadius: 5, 
    alignSelf: 'center' 
  },
  fileAttachedText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  header: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  listContent: { 
    paddingBottom: 20 
  },
  item: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 15, 
    marginBottom: 10, 
    borderRadius: 10, 
    elevation: 1, 
    justifyContent: 'space-between' 
  },
  itemTextContainer: { 
    flex: 1, 
    paddingRight: 10 
  },
  title: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    marginBottom: 4 
  },
  fileTag: {
    fontSize: 12,
    color: '#2196F3',
    marginTop: 4,
  },
  sync: { 
    fontSize: 10, 
    color: 'gray', 
    marginTop: 5 
  },
  itemImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 5 
  }
});