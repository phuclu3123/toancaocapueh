import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import CommunityPost from './models/CommunityPost.js';
import { SEED_COMMUNITY_POSTS } from './controllers/communityController.js';

async function seedDB() {
  const uri = process.env.MONGO_DIRECT_URI || process.env.MONGO_URI;
  console.log('Connecting to MongoDB Atlas...');
  try {
    await mongoose.connect(uri, {
      dbName: 'UEH_TCC',
      serverSelectionTimeoutMS: 12000
    });
    console.log('MongoDB Connected successfully!');

    console.log(`Upserting ${SEED_COMMUNITY_POSTS.length} posts into MongoDB Atlas...`);
    for (const post of SEED_COMMUNITY_POSTS) {
      const existing = await CommunityPost.findOne({ id: post.id });
      if (!existing) {
        await CommunityPost.create(post);
        console.log(`+ Created post in DB: ${post.id}`);
      } else {
        // If existing post has no answers or needs sync, keep it updated
        if (!existing.answers || existing.answers.length === 0) {
          existing.answers = post.answers;
          await existing.save();
          console.log(`~ Updated answers for: ${post.id}`);
        } else {
          console.log(`= Already exists: ${post.id} (answers: ${existing.answers.length})`);
        }
      }
    }

    const total = await CommunityPost.countDocuments();
    console.log(`Total community posts in MongoDB Atlas: ${total}`);

    // Check Olympiad post
    const olympiad = await CommunityPost.findOne({ id: 'hinh-hoc-olympic-tam-ngoai-tiep-doi-xung-oi' });
    console.log('Olympiad post check:', {
      id: olympiad?.id,
      title: olympiad?.title?.slice(0, 50),
      answersCount: olympiad?.answers?.length,
      firstAnswerComments: olympiad?.answers?.[0]?.comments?.length
    });

    await mongoose.disconnect();
    console.log('MongoDB Seeding finished cleanly!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding DB:', err.message);
    process.exit(1);
  }
}

seedDB();
