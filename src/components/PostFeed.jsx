import { useState, useEffect } from 'react'
import { getPosts } from '../services/posts'
import PostCard from './PostCard'

/**
 * Subscribes to the posts collection in real-time and renders the list.
 *
 * Props:
 *   currentUser — Firebase Auth User object (from AuthContext)
 */
export default function PostFeed({ currentUser }) {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    const unsubscribe = getPosts((updatedPosts) => {
      setPosts(updatedPosts)
    })
    return unsubscribe
  }, [])

  if (posts.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: '#888', margin: '32px 0' }}>
        Todavía no hay posteos — ¡sé el primero en publicar!
      </p>
    )
  }

  return (
    <div>
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
        />
      ))}
    </div>
  )
}
