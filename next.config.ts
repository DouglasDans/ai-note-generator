import type { NextConfig } from "next";
import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

// Turbopack (padrão a partir do Next 16) só serializa plugins remark/rehype
// passados por nome de módulo, não por referência de função — ver
// https://nextjs.org/docs/app/guides/mdx#using-plugins-with-turbopack
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: ["rehype-starry-night"],
  },
});

export default withMDX(nextConfig);
