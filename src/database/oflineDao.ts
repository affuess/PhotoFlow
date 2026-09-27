import { dbPromise } from "./db";

export interface OfflineAction {
    id: number;
    endpoint: string;
    method: string;
    payload: string;
}

export const offlineDao = {
    addAction: async (action: { endpoint: string; method: string; payload: any }): Promise<void> => {
        const db = await dbPromise;
        await db.runAsync(
            'INSERT INTO offline_actions(endpoint, method, payload) VALUES(?,?,?);',
            [action.endpoint, action.method, JSON.stringify(action.payload)]
        );
    },

    getQueue: async (): Promise<OfflineAction[]> => {
        const db = await dbPromise;
        return await db.getAllAsync<OfflineAction>('SELECT * FROM offline_actions ORDER BY id ASC;');
    },

    removeAction: async (id: number): Promise<void> => {
        const db = await dbPromise;
        await db.runAsync('DELETE FROM offline_actions WHERE id = ?;', [id]);
    },
};