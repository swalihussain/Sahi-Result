import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Other config options can be added here
    images: {
        unoptimized: true
    }
};

export default withNextIntl(nextConfig);
