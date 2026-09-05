import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import rehypeStarryNight from "rehype-starry-night";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  eslint: {
    ignoreDuringBuilds: true,
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeStarryNight],
  },
});

export default withMDX(nextConfig);
