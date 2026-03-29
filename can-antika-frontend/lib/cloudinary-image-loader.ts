import { isCloudinaryImageUrl, toCloudinaryResponsiveUrl } from "@/lib/product/image-url"

export default function cloudinaryImageLoader({
    src,
    width,
    quality,
}: {
    src: string
    width: number
    quality?: number
}): string {
    // Cloudinary images → Cloudinary CDN with responsive transforms (f_auto → WebP/AVIF)
    if (isCloudinaryImageUrl(src)) {
        return toCloudinaryResponsiveUrl(src, width, quality ?? 75)
    }

    // Local / non-Cloudinary images → return as-is
    return src
}
