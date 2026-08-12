import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql", "baileys", "pino", "qrcode"],
  async redirects() {
    return [
      { source: "/tienda", destination: "https://polleriaentrerios.com.ar/", permanent: false },
      { source: "/tienda/:path*", destination: "https://polleriaentrerios.com.ar/:path*", permanent: false },
    ];
  },
};

export default nextConfig;
