/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages deployment notes:
  //   1. Install: npm install -D @cloudflare/next-on-pages
  //   2. Add script: "pages:build": "npx @cloudflare/next-on-pages"
  //   3. CF Pages build command: npm run pages:build
  //   4. CF Pages output directory: .vercel/output/static
  //   See DEPLOY_ROCHAS.md for full instructions.

  images: {
    remotePatterns: [
      {
        // Demo photos hosted on GitHub (replace with Supabase Storage URLs in production)
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/zzzJanozzz/Comida/**",
      },
      {
        // Supabase Storage — replace <project-ref> with your actual project ref
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  trailingSlash: false,
};

export default nextConfig;
