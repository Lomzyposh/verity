import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { Play, Pause } from "lucide-react";

export default function HomeHero() {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  return (
    <section
      className="w-full min-h-screen flex items-center justify-center relative pt-24 overflow-hidden"
      style={{ background: "#F5F5F7" }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          src="/videos/heroVid.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover brightness-[0.45]"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black/50 via-black/40 to-black/10" />

        {/* PAUSE/PLAY BUTTON - TOP RIGHT */}
        <button
          onClick={togglePlayPause}
          className="absolute bottom-6 right-6 z-30 p-3 rounded-full transition-all hover:bg-white/20"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#FFFFFF",
          }}
          aria-label={isPlaying ? "Pause video" : "Play video"}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>

      {/* CONTENT */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-10 grid lg:grid-cols-2 gap-10 items-center">
        {/* LEFT SIDE */}
        <div className="text-left space-y-6">
          <p
            className="tracking-[0.35em] uppercase text-xs font-medium"
            style={{ color: "#E5E7EB" }}
          >
            Jewelry Design With Love
          </p>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight"
            style={{ color: "#FFFFFF" }}
          >
            The Perfect Jewels <br /> For You
          </h1>

          <p
            className="text-base sm:text-lg max-w-md"
            style={{ color: "#D1D5DB" }}
          >
            Welcoming in the season with an enchanting collection of handcrafted
            pieces made to shine with elegance.
          </p>

          {/* BUTTONS */}
          <div className="flex gap-4 pt-4">
            <Link
              to="/shop"
              className="px-6 py-3 rounded-lg text-sm font-semibold"
              style={{
                background: "#4B5563",
                color: "#FFFFFF",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#374151")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "#4B5563")
              }
            >
              Buy Now
            </Link>

            <Link
              to="/shop"
              className="px-6 py-3 rounded-lg text-sm font-semibold border"
              style={{
                background: "transparent",
                borderColor: "#E5E7EB",
                color: "#E5E7EB",
              }}
            >
              Explore
            </Link>
          </div>
        </div>

      
      </div>
    </section>
  );
}