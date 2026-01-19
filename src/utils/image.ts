/**
 * Converts an original image URL to its thumbnail version.
 * Supports KukeMC backend convention: .../original.ext -> .../thumbnail.ext
 */
export const getThumbnailUrl = (url: string) => {
  if (!url) return url;
  
  // Backend convention: .../original.ext -> .../thumbnail.ext
  if (url.includes('/original')) {
    return url.replace('/original', '/thumbnail');
  }
  
  // Fallback convention: name.ext -> name_thumb.ext
  // Only apply if it looks like a file path and doesn't already have _thumb
  // And avoid applying to urls that might not support this pattern unless sure
  // But strictly following user instruction "all original keywords", the first check is the most important.
  
  return url;
};
