/**
 * @returns {import('next').MetadataRoute.Robots}
 */
export default function robots() {
    const baseUrl = 'https://floyd-dev.com'

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        host: baseUrl,
    }
}
