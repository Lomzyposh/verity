import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/axios"; // keep your existing axios instance
import { Calendar, Tag, ChevronLeft, Share2, Loader2 } from "lucide-react";
import posts from "../data/blogPosts.json";

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const post = posts.find((p) => p.id === slug);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [related, setRelated] = useState([]);
  const [copyMsg, setCopyMsg] = useState("");

  const prettyDate = useMemo(() => {
    if (!post?.publishedAt) return "";
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      }).format(new Date(post.publishedAt));
    } catch {
      return post.publishedAt;
    }
  }, [post?.publishedAt]);

  //   useEffect(() => {
  //     let mounted = true;

  //     async function fetchPost() {
  //       try {
  //         setLoading(true);
  //         setErr("");

  //         const res = await api.get(`/api/blog/${slug}`);
  //         if (!mounted) return;

  //         setPost(res.data.post);

  //         // fetch related posts (same category, exclude current)
  //         const cat = res.data.post?.category;
  //         if (cat) {
  //           const rel = await api.get(`/api/blog`, {
  //             params: { category: cat, limit: 6 },
  //           });
  //           if (!mounted) return;

  //           const filtered = (rel.data.posts || []).filter(
  //             (p) => p.slug !== slug
  //           );
  //           setRelated(filtered.slice(0, 3));
  //         } else {
  //           setRelated([]);
  //         }
  //       } catch (e) {
  //         if (!mounted) return;
  //         setErr(e?.response?.data?.error || "We couldn’t load this article.");
  //         setPost(null);
  //       } finally {
  //         if (mounted) setLoading(false);
  //       }
  //     }

  //     if (slug) fetchPost();

  //     return () => {
  //       mounted = false;
  //     };
  //   }, [slug]);

  useEffect(() => {
    window.scrollTo({ top, behavior: "smooth" });
  }, [slug]);

  const copyLink = async () => {
    setCopyMsg("");
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMsg("Link copied ✨");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch {
      setCopyMsg("Couldn’t copy link");
      setTimeout(() => setCopyMsg(""), 2000);
    }
  };

  //   if (loading) {
  //     return (
  //       <main
  //         className="min-h-screen flex items-center justify-center"
  //         style={{ background: "#F5F5F7" }}
  //       >
  //         <div
  //           className="flex items-center gap-2 text-sm"
  //           style={{ color: "#6B7280" }}
  //         >
  //           <Loader2 className="animate-spin" size={16} />
  //           Loading article…
  //         </div>
  //       </main>
  //     );
  //   }

  if (err || !post) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F5F5F7" }}
      >
        <div className="text-center space-y-3 px-6">
          <p className="text-sm font-semibold" style={{ color: "#111827" }}>
            Article not found
          </p>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            {err || "This post doesn’t exist (or it was unpublished)."}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="h-11 px-5 rounded-xl border text-sm font-semibold hover:bg-white"
              style={{
                borderColor: "#E5E7EB",
                color: "#111827",
                background: "#FFFFFF",
              }}
            >
              Go back
            </button>
            <Link
              to="/blog"
              className="h-11 px-5 rounded-xl text-sm font-semibold grid place-items-center"
              style={{ background: "#111827", color: "#FFFFFF" }}
            >
              View blog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "#F5F5F7" }}>
      <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-28 pb-20">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs mb-5"
          style={{ color: "#6B7280" }}
        >
          <ChevronLeft size={16} />
          Back
        </button>

        {/* Article shell */}
        <article
          className="rounded-3xl border bg-white overflow-hidden shadow-sm"
          style={{ borderColor: "#E5E7EB" }}
        >
          {/* Cover */}
          {post.cover && (
            <div className="h-64 sm:h-80 bg-[#F3F4F6]">
              <img
                src={post.cover}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Meta row */}
            <div
              className="flex flex-wrap items-center gap-2 text-xs"
              style={{ color: "#6B7280" }}
            >
              {post.category && (
                <span className="inline-flex items-center gap-1">
                  <Tag size={14} />
                  <span className="font-medium">{post.category}</span>
                </span>
              )}
              {prettyDate && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={14} />
                    {prettyDate}
                  </span>
                </>
              )}
              {post.readTime && (
                <>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </>
              )}
            </div>

            {/* Title */}
            <h1
              className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: "#111827" }}
            >
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p
                className="mt-3 text-sm sm:text-base"
                style={{ color: "#6B7280" }}
              >
                {post.excerpt}
              </p>
            )}

            {/* Share */}
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="h-10 px-4 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 hover:bg-slate-50"
                style={{
                  borderColor: "#E5E7EB",
                  color: "#111827",
                  background: "#FFFFFF",
                }}
              >
                <Share2 size={14} />
                Copy link
              </button>
              {copyMsg && (
                <span className="text-xs" style={{ color: "#2563EB" }}>
                  {copyMsg}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="mt-8">
              {/* If your backend returns HTML in post.contentHtml, use it */}
              {post.contentHtml ? (
                <div
                  className="prose max-w-none"
                  style={{ color: "#111827" }}
                  dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                />
              ) : (
                // Otherwise treat `content` as plain text with line breaks
                <div
                  className="text-sm leading-7 whitespace-pre-line"
                  style={{ color: "#111827" }}
                >
                  {post.content || "No content."}
                </div>
              )}
            </div>

            {/* Tags */}
            {Array.isArray(post.tags) && post.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-[11px] font-medium border"
                    style={{
                      borderColor: "#E5E7EB",
                      color: "#4B5563",
                      background: "#FFFFFF",
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2
                className="text-sm font-semibold"
                style={{ color: "#111827" }}
              >
                Related posts
              </h2>
              <Link
                to="/blog"
                className="text-xs font-semibold"
                style={{ color: "#2563EB" }}
              >
                View all →
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="rounded-3xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  {p.coverUrl ? (
                    <img
                      src={p.coverUrl}
                      alt={p.title}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="h-32 bg-[#F3F4F6]" />
                  )}

                  <div className="p-4">
                    <p className="text-[11px]" style={{ color: "#6B7280" }}>
                      {p.category || "Blog"} • {p.readTime || "—"}
                    </p>
                    <p
                      className="mt-1 text-sm font-semibold line-clamp-2"
                      style={{ color: "#111827" }}
                    >
                      {p.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
