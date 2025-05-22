/**
 * @file        Configuration Next.js pour le widget web SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['@salambot/ai'],
};

module.exports = nextConfig;
