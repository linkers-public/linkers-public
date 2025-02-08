'use client'
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const images = [
  "https://fqrhngwctyxjpperqgqk.supabase.co/storage/v1/object/public/magazine//1week.png", // Replace these with your actual image paths
  "https://fqrhngwctyxjpperqgqk.supabase.co/storage/v1/object/public/magazine//2week.png",
  "https://fqrhngwctyxjpperqgqk.supabase.co/storage/v1/object/public/magazine//1week.png", // Replace these with your actual image paths
  "https://fqrhngwctyxjpperqgqk.supabase.co/storage/v1/object/public/magazine//2week.png",
  "https://fqrhngwctyxjpperqgqk.supabase.co/storage/v1/object/public/magazine//1week.png", // Replace these with your actual image paths
  "https://fqrhngwctyxjpperqgqk.supabase.co/storage/v1/object/public/magazine//2week.png",
];

const Carousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 3 ? 0 : prevIndex + 1 // Show 3 images at a time
      );
    }, 3000); // Slide every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-3xl mx-auto overflow-hidden"> {/* max-w-5xl -> max-w-3xl로 축소 */}
      {/* Carousel Wrapper */}
      <motion.div
        className="flex"
        animate={{
          x: `-${currentIndex * (100)}%`, // Adjust slide distance for 3 images
        }}
        transition={{
          duration: 0.5,
          ease: "easeInOut",
        }}
        style={{ width: `100%` }}
      >
        {images.map((src, index) => (
          <div
            key={index}
            className="w-1/3 flex-shrink-0 px-1" // px-2 -> px-1로 축소하여 간격 줄임
          >
            <img
              src={src}
              alt={`Slide ${index}`}
              className="w-full h-auto object-cover rounded-md shadow-sm" // rounded-lg -> rounded-md로 축소
            />
          </div>
        ))}
      </motion.div>

      {/* Navigation Dots */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1"> {/* bottom-4 -> bottom-2, space-x-2 -> space-x-1 */}
        {Array.from({ length: images.length - 2 }).map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? "bg-gray-800" : "bg-gray-400"
            }`} // w-3 h-3 -> w-2 h-2로 축소
            onClick={() => setCurrentIndex(index)}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
