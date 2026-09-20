export type ImageDimensions = {
  width: number;
  height: number;
};

export function getImageDimensions(
  url: string,
): Promise<ImageDimensions | null> {
  return new Promise((resolve) => {
    const image = new Image();

    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => resolve(null);
    image.src = url;
  });
}
