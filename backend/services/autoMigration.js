import CommunityPost from '../models/CommunityPost.js';
import { SEED_COMMUNITY_POSTS } from '../controllers/communityController.js';

export const runAutoMigration = async () => {
  try {
    console.log('--- Đang đồng bộ dữ liệu Community sang MongoDB Atlas ---');
    for (const post of SEED_COMMUNITY_POSTS) {
      const existing = await CommunityPost.findOne({ id: post.id });
      if (!existing) {
        await CommunityPost.create(post);
        console.log(`[AutoMigration] + Đã tạo bài viết: ${post.id}`);
      }
    }
    console.log('--- Hoàn tất đồng bộ dữ liệu Community trên MongoDB Atlas ---');
  } catch (err) {
    console.warn('[AutoMigration] Cảnh báo đồng bộ:', err.message);
  }
};
