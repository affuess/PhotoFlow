import { dbPromise } from "./db";

export interface LocalMediaItem {
    id: string;
    title: string;
    description?: string;
    image_uri?: string;
    created_at: string;
    synced: number; // 1 - sync, 0 - unsync
}

export const mediaDao = {
    getAll: async (): Promise<LocalMediaItem[]> => {
        const db = await dbPromise;
        return await db.getAllAsync<LocalMediaItem>(
            'SELECT * FROM media_items ORDER BY created_at DESC;'
        );
    },
    
    saveOrUpdate: async (item: LocalMediaItem): Promise<void> => {
        const db = await dbPromise;
        await db.runAsync(
            `INSERT INTO media_items(id, title, description, image_uri, created_at, synced)
            VALUES(?,?,?,?,?,?)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                description = excluded.description,
                image_uri = excluded.image_uri,
                synced = excluded.synced;`,
            [item.id, item.title, item.description || '', item.image_uri || '', item.created_at, item.synced]
        );
    },

    saveList: async (items: LocalMediaItem[]): Promise<void> => {
        const db = await dbPromise;
        await db.withTransactionAsync(async () => {
            for (const item of items) {
                await db.runAsync(
                    `INSERT INTO media_items(id, title, description, image_uri, created_at, synced)
                        VALUES(?,?,?,?,?,?)
                        ON CONFLICT(id) DO UPDATE SET
                            title = excluded.title,
                            description = excluded.description,
                            image_uri = excluded.image_uri,
                            synced = excluded.synced;`,
                    [item.id, item.title, item.description || '', item.image_uri || '', item.created_at, item.synced]
                );
            }
        });
    },
};