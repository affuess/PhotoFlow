import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, FlatList, TextInput, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useOfflineFeed } from './src/hooks/useOfflineFeed';
import { initDatabase } from './src/database/db';

export default function App() {
  const { items, isOffline, saveNote } = useOfflineFeed();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

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

  const handleAdd = () => {
    if (!title) {
      Alert.alert('Error', 'Title is required');
      return;
    }
    saveNote(title, desc, imageUri || undefined);
    
    setTitle('');
    setDesc('');
    setImageUri(null);
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

        <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
          <Text>+ Add Photo</Text>
        </TouchableOpacity>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

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
  imagePickerBtn: { 
    backgroundColor: '#e0e0e0', 
    padding: 10, 
    alignItems: 'center', 
    borderRadius: 5, 
    marginBottom: 10 
  },
  previewImage: { 
    width: 100, 
    height: 100, 
    marginBottom: 10, 
    borderRadius: 5, 
    alignSelf: 'center' 
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