import imageCompression from 'browser-image-compression'

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file

  return imageCompression(file, {
    maxSizeMB: 0.7,
    initialQuality: 0.85,
    useWebWorker: true,
    fileType: 'image/jpeg'
  })
}
