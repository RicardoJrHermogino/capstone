/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Enables static export
  images: {
    unoptimized: true, // Disables the Image Optimization API
}
,trailingSlash: true, // Add trailing slashes for better static compatibility
};

export default nextConfig;
