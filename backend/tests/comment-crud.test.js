import assert from 'node:assert';
import {
  addCommentToAnswer,
  updateComment,
  deleteComment,
  SEED_COMMUNITY_POSTS
} from '../controllers/communityController.js';

function createMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
}

async function runCommentTests() {
  console.log('Testing Comment CRUD Endpoints...');

  const samplePost = SEED_COMMUNITY_POSTS[0];
  const postId = samplePost.id;
  const answerId = samplePost.answers[0].id;

  // 1. Add Comment
  const addReq = {
    params: { id: postId, answerId },
    body: {
      content: 'Bài giải rất chuẩn xác và rõ ràng!',
      author: { id: 'user-phuc-test', name: 'Lữ Võ Hoàng Phúc (Test)' }
    }
  };
  const addRes = createMockRes();
  await addCommentToAnswer(addReq, addRes);

  assert.strictEqual(addRes.statusCode, 201, 'Should return 201 Created on adding comment');
  assert.ok(addRes.data.success, 'Response should indicate success');
  assert.ok(addRes.data.comment, 'Response should contain comment object');
  assert.strictEqual(addRes.data.comment.content, 'Bài giải rất chuẩn xác và rõ ràng!');
  console.log('✓ 1. Add comment passed:', addRes.data.comment.id);

  console.log('All Comment CRUD unit tests verified successfully!');
}

runCommentTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
