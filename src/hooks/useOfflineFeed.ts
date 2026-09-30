import { useState, useEffect, useCallback } from "react";
import NetInfo from '@react-native-community/netinfo';
import { mediaDao, LocalMediaItem } from "../database/mediaDao";
import { offlineDao } from "../database/oflineDao";
import { dbPromise } from "../database/db";
import { apiClient } from "../api/client";

export function useOfflineFeed() {
    const [items, setItems] = useState<LocalMediaItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isOffline, setIsOffline] = useState<boolean>(false);

    const loadLocalData = async () => {
        const localData = await mediaDao.getAll();
        setItems(localData);
    };

    const syncOfflineQueue = async () => {
        try {
            const queue = await offlineDao.getQueue();
            for (const action of queue) {
                try {
                    if (action.method === 'POST') {
                        const payload = JSON.parse(action.payload);
                        
                        await apiClient.post(action.endpoint, payload);

                        const db = await dbPromise;
                        await db.runAsync(
                            'UPDATE media_items SET synced = 1 WHERE id = ?;',
                            [payload.id]
                        );
                    }
                    await offlineDao.removeAction(action.id);
                } catch (e) {
                    console.log("Failed to sync action:", e);
                    break;
                }
            }
            await loadLocalData();
        } catch (err) {
            console.log("Sync queue error:", err);
        }
    };

    const fetchFeed = useCallback(async () => {
        const netState = await NetInfo.fetch();
        const offline = !netState.isConnected;
        setIsOffline(offline);

        await loadLocalData();
        setLoading(false);

        if (!offline) {
            await syncOfflineQueue();
            try {
                const response = await apiClient.get<LocalMediaItem[]>('posts');
                if (response.data) {
                   await loadLocalData();
                }
            } catch (err) {
                console.log("Error fetching feed: ", err);
            }
        }
    }, []);

    const saveNote = async (
        title: string, 
        description: string, 
        imageUri?: string,
        fileUri?: string,
        fileName?: string
    ) => {
        const netState = await NetInfo.fetch();
        const isConnected = !!netState.isConnected;

        const newItem: LocalMediaItem = {
            id: Date.now().toString(),
            title,
            description,
            image_uri: imageUri,
            file_uri: fileUri,
            file_name: fileName,
            created_at: new Date().toISOString(),
            synced: isConnected ? 1 : 0,
        };

        await mediaDao.saveOrUpdate(newItem);
        await loadLocalData();

        if (isConnected) {
            try {
                await apiClient.post('posts/add', newItem);
            } catch (err) {
                console.log("Net error, saving action to queue", err);
                await mediaDao.saveOrUpdate({ ...newItem, synced: 0 });
                await loadLocalData();
                
                await offlineDao.addAction({
                    endpoint: 'posts/add',
                    method: 'POST',
                    payload: newItem,
                });
            }
        } else {
            await offlineDao.addAction({
                endpoint: 'posts/add',
                method: 'POST',
                payload: newItem,
            });
        }
    };

    useEffect(() => {
        fetchFeed();
        const unsubscribe = NetInfo.addEventListener((state) => {
            const offline = !state.isConnected;
            setIsOffline(offline);
            if (!offline) {
                fetchFeed();
            }
        });
        return () => unsubscribe();
    }, [fetchFeed]);

    return { items, loading, isOffline, saveNote, refresh: fetchFeed };
}