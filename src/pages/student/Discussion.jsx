import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';
import Footer from '../../components/student/Footer';
import Loading from '../../components/student/Loading';

// ─── helpers ────────────────────────────────────────────────────────────────

const Avatar = ({ src, name }) => (
  src
    ? <img src={src} alt={name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
    : <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
        {name?.[0]?.toUpperCase() || '?'}
      </div>
);

const UpvoteButton = ({ count, active, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={disabled ? 'Sign in to upvote' : ''}
    className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition
      ${active ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    ▲ {count}
  </button>
);

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ─── SubReply ───────────────────────────────────────────────────────────────

const SubReply = ({ sub, courseId, discussionId, replyId, currentUserId, isEducator, isEnrolled, onRefresh, getToken, backendUrl }) => {
  const canDelete = isEducator || sub.author?._id === currentUserId;

  const handleUpvote = async () => {
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/discussion/${courseId}/${discussionId}/reply/${replyId}/subreply/${sub._id}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      const token = await getToken();
      await axios.delete(
        `${backendUrl}/api/discussion/${courseId}/${discussionId}/reply/${replyId}/subreply/${sub._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="flex gap-2 py-2">
      <Avatar src={sub.author?.imageUrl} name={sub.author?.name} />
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-800">{sub.author?.name || 'Unknown'}</span>
          {sub.isEducatorReply && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Educator</span>
          )}
          <span className="text-xs text-gray-400">{timeAgo(sub.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700 mt-0.5">{sub.content}</p>
        <div className="flex items-center gap-3 mt-1">
          <UpvoteButton
            count={sub.upvotes?.length || 0}
            active={sub.upvotes?.includes(currentUserId)}
            onClick={handleUpvote}
            disabled={!isEnrolled && !isEducator}
          />
          {canDelete && (
            <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Reply ──────────────────────────────────────────────────────────────────

const Reply = ({ reply, courseId, discussionId, currentUserId, isEducator, isEnrolled, onRefresh, getToken, backendUrl }) => {
  const [showSubReplyForm, setShowSubReplyForm] = useState(false);
  const [subReplyContent, setSubReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canDelete = isEducator || reply.author?._id === currentUserId;

  const handleUpvote = async () => {
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/discussion/${courseId}/${discussionId}/reply/${reply._id}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this reply?')) return;
    try {
      const token = await getToken();
      await axios.delete(
        `${backendUrl}/api/discussion/${courseId}/${discussionId}/reply/${reply._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSubReply = async (e) => {
    e.preventDefault();
    if (!subReplyContent.trim()) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/discussion/${courseId}/${discussionId}/reply/${reply._id}/subreply`,
        { content: subReplyContent.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubReplyContent('');
      setShowSubReplyForm(false);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`flex gap-2 py-3 ${reply.isEducatorReply ? 'bg-yellow-50 px-3 rounded-lg' : ''}`}>
      <Avatar src={reply.author?.imageUrl} name={reply.author?.name} />
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-800">{reply.author?.name || 'Unknown'}</span>
          {reply.isEducatorReply && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-medium">Educator</span>
          )}
          <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-700 mt-0.5">{reply.content}</p>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <UpvoteButton
            count={reply.upvotes?.length || 0}
            active={reply.upvotes?.includes(currentUserId)}
            onClick={handleUpvote}
            disabled={!isEnrolled && !isEducator}
          />
          {(isEnrolled || isEducator) && (
            <button
              onClick={() => setShowSubReplyForm(v => !v)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Reply
            </button>
          )}
          {canDelete && (
            <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600">Delete</button>
          )}
        </div>

        {/* Sub-replies */}
        {reply.subReplies?.length > 0 && (
          <div className="mt-2 pl-4 border-l-2 border-gray-100 space-y-0 divide-y divide-gray-100">
            {reply.subReplies.map(sub => (
              <SubReply
                key={sub._id}
                sub={sub}
                courseId={courseId}
                discussionId={discussionId}
                replyId={reply._id}
                currentUserId={currentUserId}
                isEducator={isEducator}
                isEnrolled={isEnrolled}
                onRefresh={onRefresh}
                getToken={getToken}
                backendUrl={backendUrl}
              />
            ))}
          </div>
        )}

        {/* Sub-reply form */}
        {showSubReplyForm && (
          <form onSubmit={handleSubReply} className="mt-2 flex gap-2">
            <input
              value={subReplyContent}
              onChange={e => setSubReplyContent(e.target.value)}
              placeholder="Write a reply…"
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-60"
            >
              Post
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── DiscussionCard ──────────────────────────────────────────────────────────

const DiscussionCard = ({ discussion, courseId, currentUserId, isEducator, isEnrolled, onRefresh, getToken, backendUrl }) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const canDelete = isEducator || discussion.author?._id === currentUserId;

  const handleUpvote = async () => {
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/discussion/${courseId}/${discussion._id}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const handleBoost = async () => {
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/discussion/${courseId}/${discussion._id}/boost`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
    } catch {
      toast.error('Failed to boost');
    }
  };

  const handlePin = async () => {
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/discussion/${courseId}/${discussion._id}/pin`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onRefresh();
    } catch {
      toast.error('Failed to pin');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this discussion?')) return;
    try {
      const token = await getToken();
      await axios.delete(
        `${backendUrl}/api/discussion/${courseId}/${discussion._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Discussion deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await axios.post(
        `${backendUrl}/api/discussion/${courseId}/${discussion._id}/reply`,
        { content: replyContent.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReplyContent('');
      setShowReplyForm(false);
      setShowReplies(true);
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`bg-white border rounded-xl p-5 shadow-sm transition
      ${discussion.isPinned ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'}
      ${discussion.isBoosted ? 'border-yellow-300 ring-1 ring-yellow-200' : ''}`}>

      {/* Badges */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {discussion.isPinned && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">📌 Pinned</span>
        )}
        {discussion.isBoosted && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">⭐ Boosted</span>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar src={discussion.author?.imageUrl} name={discussion.author?.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-800 text-sm">{discussion.author?.name || 'Unknown'}</span>
            <span className="text-xs text-gray-400">{timeAgo(discussion.createdAt)}</span>
          </div>
          <h3 className="font-semibold text-gray-900 mt-1">{discussion.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{discussion.content}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <UpvoteButton
          count={discussion.upvotes?.length || 0}
          active={discussion.upvotes?.includes(currentUserId)}
          onClick={handleUpvote}
          disabled={!isEnrolled && !isEducator}
        />

        <button
          onClick={() => { setShowReplies(v => !v); }}
          className="text-xs text-gray-500 hover:text-blue-600"
        >
          💬 {discussion.replies?.length || 0} {discussion.replies?.length === 1 ? 'reply' : 'replies'}
        </button>

        {(isEnrolled || isEducator) && (
          <button
            onClick={() => setShowReplyForm(v => !v)}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            Reply
          </button>
        )}

        {isEducator && (
          <>
            <button
              onClick={handlePin}
              className={`text-xs px-2 py-0.5 rounded border transition ${discussion.isPinned ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600'}`}
            >
              {discussion.isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
              onClick={handleBoost}
              className={`text-xs px-2 py-0.5 rounded border transition ${discussion.isBoosted ? 'bg-yellow-500 text-white border-yellow-500' : 'border-gray-300 text-gray-500 hover:border-yellow-400 hover:text-yellow-600'}`}
            >
              {discussion.isBoosted ? 'Unboost' : 'Boost'}
            </button>
          </>
        )}

        {canDelete && (
          <button onClick={handleDelete} className="text-xs text-red-400 hover:text-red-600 ml-auto">
            Delete
          </button>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <form onSubmit={handleReply} className="mt-3 flex gap-2">
          <input
            value={replyContent}
            onChange={e => setReplyContent(e.target.value)}
            placeholder="Write a reply…"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-60"
          >
            Post
          </button>
        </form>
      )}

      {/* Replies */}
      {showReplies && discussion.replies?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 divide-y divide-gray-100">
          {discussion.replies.map(reply => (
            <Reply
              key={reply._id}
              reply={reply}
              courseId={courseId}
              discussionId={discussion._id}
              currentUserId={currentUserId}
              isEducator={isEducator}
              isEnrolled={isEnrolled}
              onRefresh={onRefresh}
              getToken={getToken}
              backendUrl={backendUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Discussion Page ─────────────────────────────────────────────────────────

const Discussion = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { backendUrl, getToken, userData, isEducator, enrolledCourses } = useContext(AppContext);

  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = userData?._id;
  const isEnrolled = enrolledCourses?.some(c => c._id === courseId) || isEducator;

  const fetchDiscussions = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/discussion/${courseId}`);
      if (data.success) {
        // Pinned first, then by date descending
        const sorted = [...data.discussions].sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setDiscussions(sorted);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [courseId]);

  const handleNewPost = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/discussion/${courseId}`,
        { title: title.trim(), content: content.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setTitle('');
        setContent('');
        fetchDiscussions();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post discussion');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <>
      <div className="min-h-screen md:px-36 px-4 py-10">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(`/player/${courseId}`)}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to course
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-2xl font-bold text-gray-900">Community Discussion</h1>
        </div>

        {/* New post form */}
        {isEnrolled ? (
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-8">
            <h2 className="font-semibold text-gray-800 mb-3">Start a Discussion</h2>
            <form onSubmit={handleNewPost} className="space-y-3">
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="What's your question or thought?"
                rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
              />
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="px-5 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Posting…' : 'Post Discussion'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-sm text-blue-700">
            Enroll in this course to participate in discussions.
          </div>
        )}

        {/* Discussion list */}
        {discussions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-lg font-medium">No discussions yet</p>
            <p className="text-sm">Be the first to start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discussions.map(discussion => (
              <DiscussionCard
                key={discussion._id}
                discussion={discussion}
                courseId={courseId}
                currentUserId={currentUserId}
                isEducator={isEducator}
                isEnrolled={isEnrolled}
                onRefresh={fetchDiscussions}
                getToken={getToken}
                backendUrl={backendUrl}
              />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default Discussion;
