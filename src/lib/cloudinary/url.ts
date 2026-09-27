const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

export function cloudinaryThumb(publicId: string, width = 400) {
  if (!CLOUD || !publicId) return "";
  return `https://res.cloudinary.com/${CLOUD}/image/upload/c_fill,w_${width},f_auto,q_auto/${publicId}`;
}

export function cloudinaryResponsive(publicId: string, width = 1200) {
  if (!CLOUD || !publicId) return "";
  return `https://res.cloudinary.com/${CLOUD}/image/upload/c_limit,w_${width},f_auto,q_auto/${publicId}`;
}

export function cloudinaryUrl(secureUrl: string | undefined | null) {
  return secureUrl || "";
}
