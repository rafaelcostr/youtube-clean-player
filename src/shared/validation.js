export const MAX_CLICK_RECT_WIDTH = 800;
export const MAX_CLICK_RECT_HEIGHT = 400;

const MAX_ABSOLUTE_COORD = 10000;

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function isValidClickRect(rect, viewport = null) {
  if (!rect || typeof rect !== "object") {
    return false;
  }

  const { x, y, width, height } = rect;

  if (![x, y, width, height].every(isFiniteNumber)) {
    return false;
  }

  if (width <= 0 || height <= 0 || width > MAX_CLICK_RECT_WIDTH || height > MAX_CLICK_RECT_HEIGHT) {
    return false;
  }

  if (viewport) {
    const maxWidth = viewport.innerWidth;
    const maxHeight = viewport.innerHeight;

    if (!isFiniteNumber(maxWidth) || !isFiniteNumber(maxHeight) || maxWidth <= 0 || maxHeight <= 0) {
      return false;
    }

    if (x < 0 || y < 0 || x >= maxWidth || y >= maxHeight) {
      return false;
    }

    if (x + width > maxWidth + 1 || y + height > maxHeight + 1) {
      return false;
    }

    return true;
  }

  if (x < 0 || y < 0 || x > MAX_ABSOLUTE_COORD || y > MAX_ABSOLUTE_COORD) {
    return false;
  }

  return true;
}

export function isYouTubeTabUrl(url) {
  if (typeof url !== "string") {
    return false;
  }

  try {
    const { hostname, protocol } = new URL(url);
    return protocol === "https:" && (hostname === "www.youtube.com" || hostname === "youtube.com");
  } catch {
    return false;
  }
}
