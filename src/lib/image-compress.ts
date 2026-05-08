import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
  })
}
