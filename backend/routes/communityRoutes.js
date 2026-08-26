import express from 'express';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleUpvotePost,
  addAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
  addCommentToAnswer,
  updateComment,
  deleteComment,
  getLeaderboard,
  getStats
} from '../controllers/communityController.js';

const router = express.Router();

// Question routes
router.get('/community/posts', getPosts);
router.get('/community/posts/:id', getPostById);
router.post('/community/posts', createPost);
router.put('/community/posts/:id', updatePost);
router.delete('/community/posts/:id', deletePost);
router.post('/community/posts/:id/upvote', toggleUpvotePost);

// Answer routes
router.post('/community/posts/:id/answers', addAnswer);
router.put('/community/posts/:id/answers/:answerId', updateAnswer);
router.delete('/community/posts/:id/answers/:answerId', deleteAnswer);
router.post('/community/posts/:id/answers/:answerId/accept', acceptAnswer);
router.post('/community/posts/:id/answers/:answerId/comments', addCommentToAnswer);
router.put('/community/posts/:id/answers/:answerId/comments/:commentId', updateComment);
router.delete('/community/posts/:id/answers/:answerId/comments/:commentId', deleteComment);

// Stats & Leaderboard
router.get('/community/leaderboard', getLeaderboard);
router.get('/community/stats', getStats);

export default router;
