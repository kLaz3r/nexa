"use client";

import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useRef, useState } from "react";

// Dynamically import the server component Post so that it can be rendered as needed.
const Post = dynamic(
  () => import("~/components/Post").then((mod) => mod.Post),
  { ssr: true },
);

export type PostType = {
  id: string;
  content: string;
  imageUrl?: string | null;
  timestamp: Date;
  authorId: string;
  comments: any[];
  likes: {
    id: string;
    userId: string;
    postId: string;
  }[];
  author: {
    id: string;
    username: string;
    avatar: string | null;
    email: string;
    bio: string;
    location: string;
    createdAt: string;
  };
};

export default function InfinitePosts() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // loadPosts now computes the offset based on posts.length without a separate "page" state.
  const loadPosts = useCallback(async () => {
    setLoading(true);
    const limit = 10;
    const skip = posts.length; // Use the current post count as the offset
    try {
      const res = await fetch(`/api/posts/get?skip=${skip}&limit=${limit}`);
      if (!res.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data: PostType[] = await res.json();

      // Compute only new (unique) posts that haven't been loaded yet.
      setPosts((prevPosts) => {
        const newUniquePosts = data.filter(
          (post) => !prevPosts.some((p) => p.id === post.id),
        );
        // If no new unique posts or the API returned fewer posts than requested,
        // then there are no more unique posts.
        if (newUniquePosts.length === 0 || data.length < limit) {
          setHasMore(false);
        }
        return [...prevPosts, ...newUniquePosts];
      });
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  }, [posts.length]);

  // Load the first set of posts when the component mounts.
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Set up the IntersectionObserver to load more posts when the sentinel comes into view.
  useEffect(() => {
    if (loading || !hasMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadPosts();
      }
    });
    if (loadMoreRef.current) {
      observer.current.observe(loadMoreRef.current);
    }

    return () => observer.current?.disconnect();
  }, [loading, hasMore, loadPosts]);

  return (
    <div className="flex w-full max-w-[650px] flex-col items-center gap-4">
      {posts.map((post) => (
        <Post key={post.id} post={post} />
      ))}
      {loading && <span className="loader"></span>}
      {/* Sentinel element */}
      <div ref={loadMoreRef} className="h-1 w-full" />
      {!hasMore && <p>No more posts.</p>}
    </div>
  );
}
