import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { mediaDao, LocalMediaItem } from '../database/mediaDao';
import { offlineDao } from '../database/oflineDao';
import { apiClient } from '../api/client';
import { Post, CreatePostPayload } from '../types/post';

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  const loadLocalPosts = async () => {
    try {
      const localData = await mediaDao.getAll();
      setPosts(localData as Post[]);
    } catch (error) {
      console.error('Помилка читання з SQLite:', error);
    }
  };

  const syncOfflineQueue = async () => {
    try {
      const queue = await offlineDao.getQueue();
      for (const action of queue) {
        try {
          if (action.method === 'POST') {
            const payload = JSON.parse(action.payload);
            await apiClient.post(action.endpoint, payload);

            await mediaDao.saveOrUpdate({
              ...payload,
              synced: 1,
            });
          }
          await offlineDao.removeAction(action.id);
        } catch (e) {
          console.error('Помилка синхронізації елемента:', e);
          break;
        }
      }
      await loadLocalPosts();
    } catch (err) {
      console.error('Помилка синхронізації черги:', err);
    }
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const netState = await NetInfo.fetch();
    const offline = !netState.isConnected;
    setIsOffline(offline);

    await loadLocalPosts();

    if (!offline) {
      await syncOfflineQueue();
      try {
        const response = await apiClient.get<LocalMediaItem[]>('posts');
        if (response.data && Array.isArray(response.data)) {
          await mediaDao.saveList(response.data);
          await loadLocalPosts();
        }
      } catch (err) {
        console.log('Помилка отримання з сервера:', err);
      }
    }
    setLoading(false);
  }, []);

  const createPost = async (payload: CreatePostPayload) => {
    const netState = await NetInfo.fetch();
    const isConnected = !!netState.isConnected;

    const newPost: Post = {
      id: Date.now().toString(),
      title: payload.title,
      description: payload.description,
      image_uri: payload.image_uri,
      file_uri: payload.file_uri,
      file_name: payload.file_name,
      created_at: new Date().toISOString(),
      synced: isConnected ? 1 : 0,
    };

    await mediaDao.saveOrUpdate(newPost);
    await loadLocalPosts();

    if (isConnected) {
      try {
        await apiClient.post('posts/add', newPost);
      } catch (err) {
        console.log('Помилка мережі при відправці, додаємо в чергу:', err);
        await mediaDao.saveOrUpdate({ ...newPost, synced: 0 });
        await offlineDao.addAction({
          endpoint: 'posts/add',
          method: 'POST',
          payload: newPost,
        });
        await loadLocalPosts();
      }
    } else {
      await offlineDao.addAction({
        endpoint: 'posts/add',
        method: 'POST',
        payload: newPost,
      });
    }
  };

  useEffect(() => {
    fetchPosts();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !state.isConnected;
      setIsOffline(offline);
      if (!offline) {
        syncOfflineQueue();
      }
    });

    return () => unsubscribe();
  }, [fetchPosts]);

  return {
    posts,
    loading,
    isOffline,
    createPost,
    refreshPosts: fetchPosts,
  };
}