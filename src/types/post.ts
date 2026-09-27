export interface Post {
  id: string;
  title: string;
  description?: string;
  image_uri?: string;
  created_at: string;
  synced: number; 
}

export interface CreatePostPayload {
  title: string;
  description?: string;
  image_uri?: string;
}