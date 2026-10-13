export const MAX_PHOTOS = 5
export const MAX_PHOTO_SIZE = 1_048_576
export const MAX_PHOTOS_SIZE = 5 * 1_048_576
export const MAX_VIDEO_SIZE = 15 * 1_048_576
export const MAX_TOTAL_SIZE = 20 * 1_048_576
export const MAX_VIDEO_DURATION = 30

// Metadata often reports a 30 s clip as slightly longer (e.g. 30.02 s), so accept anything below 31 s.
export function isVideoDurationAllowed(duration: number) {
  return duration < MAX_VIDEO_DURATION + 1
}
export const MAX_VIDEO_WIDTH = 854
export const MAX_VIDEO_HEIGHT = 480
export const MAX_SOURCE_VIDEO_SIZE = 100 * 1_048_576

export interface PhotoAttachment {
  id: string
  sourceId: string
  originalName: string
  file: File
  previewUrl: string
}

export interface VideoAttachment {
  id: string
  originalName: string
  file: File
  previewUrl: string
  duration: number
  width: number
  height: number
}

export interface RepairAttachments {
  photos: PhotoAttachment[]
  video: VideoAttachment | null
}

export interface VideoMetadata {
  duration: number
  width: number
  height: number
}

function hasBytes(bytes: Uint8Array, expected: number[], offset = 0) {
  return expected.every((byte, index) => bytes[offset + index] === byte)
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.slice(offset, offset + length))
}

async function detectImageFormat(file: File): Promise<'jpeg' | 'png' | 'webp' | 'heic' | null> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())

  if (hasBytes(bytes, [0xff, 0xd8, 0xff])) return 'jpeg'
  if (hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'webp'
  if (ascii(bytes, 4, 4) === 'ftyp' && /^(heic|heix|hevc|hevx|mif1|msf1)$/.test(ascii(bytes, 8, 4))) {
    return 'heic'
  }
  return null
}

async function loadImage(file: File) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return {
        source: bitmap as CanvasImageSource,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      }
    } catch {
      // Fall back to the browser's image element decoder where ImageBitmap is unavailable for this file.
    }
  }

  const url = URL.createObjectURL(file)
  const image = new Image()
  image.src = url

  try {
    await image.decode()
    return {
      source: image as CanvasImageSource,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(url),
    }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error('Nie udało się odczytać zdjęcia. Plik może być uszkodzony lub nieobsługiwany.')
  }
}

function encodeCanvas(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export async function compressPhoto(file: File): Promise<File> {
  const format = await detectImageFormat(file)
  if (format === 'heic') {
    throw new Error('Format HEIC/HEIF nie jest obsługiwany przez tę przeglądarkę. Przekonwertuj zdjęcie do JPEG, PNG lub WebP.')
  }
  if (!format) {
    throw new Error('Nieobsługiwany format zdjęcia. Wybierz plik JPEG, PNG lub WebP.')
  }

  let image: Awaited<ReturnType<typeof loadImage>>
  try {
    image = await loadImage(file)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Nie udało się odczytać')) throw error
    throw new Error('Nie udało się odczytać zdjęcia. Plik może być uszkodzony lub nieobsługiwany.')
  }

  try {
    if (!image.width || !image.height) {
      throw new Error('Zdjęcie nie zawiera prawidłowych wymiarów.')
    }

    const initialScale = Math.min(1, 854 / Math.max(image.width, image.height))
    let width = Math.max(1, Math.round(image.width * initialScale))
    let height = Math.max(1, Math.round(image.height * initialScale))
    let mimeType: 'image/webp' | 'image/jpeg' = 'image/webp'

    while (true) {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Nie udało się przygotować zdjęcia do kompresji.')
      context.drawImage(image.source, 0, 0, width, height)

      for (let quality = 0.9; quality >= 0.4; quality -= 0.1) {
        let blob = await encodeCanvas(canvas, mimeType, quality)
        if (mimeType === 'image/webp' && (!blob || blob.type !== 'image/webp')) {
          mimeType = 'image/jpeg'
          blob = await encodeCanvas(canvas, mimeType, quality)
        }
        if (!blob || blob.type !== mimeType) {
          throw new Error('Nie udało się skompresować zdjęcia w obsługiwanym formacie.')
        }
        if (blob.size <= MAX_PHOTO_SIZE) {
          const extension = mimeType === 'image/webp' ? 'webp' : 'jpg'
          return new File([blob], `zdjecie-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`, {
            type: mimeType,
            lastModified: Date.now(),
          })
        }
      }

      const longestSide = Math.max(width, height)
      if (longestSide <= 320) break
      const scale = Math.max(320 / longestSide, 0.85)
      width = Math.max(1, Math.round(width * scale))
      height = Math.max(1, Math.round(height * scale))
    }

    throw new Error('Nie udało się zmniejszyć zdjęcia do 1 MB bez utraty czytelności. Wybierz inne zdjęcie.')
  } finally {
    image.dispose()
  }
}

function readVideoMetadata(url: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const timeout = window.setTimeout(() => finish(new Error('Nie udało się odczytać filmu. Spróbuj wybrać plik ponownie.')), 15_000)

    const cleanup = () => {
      window.clearTimeout(timeout)
      video.removeEventListener('loadedmetadata', onLoaded)
      video.removeEventListener('error', onError)
      video.removeAttribute('src')
      video.load()
    }
    const finish = (error?: Error) => {
      const metadata = { duration: video.duration, width: video.videoWidth, height: video.videoHeight }
      cleanup()
      if (error) reject(error)
      else resolve(metadata)
    }
    const onLoaded = () => finish()
    const onError = () => finish(new Error('Nie można odczytać filmu. Wybierz obsługiwany plik MP4 lub MOV.'))

    video.addEventListener('loadedmetadata', onLoaded, { once: true })
    video.addEventListener('error', onError, { once: true })
    video.src = url
  })
}

export async function compressVideo(
  file: File,
  onProgress: (progress: number) => void,
): Promise<{ file: File; metadata: VideoMetadata }> {
  if (file.size > MAX_SOURCE_VIDEO_SIZE) {
    throw new Error('Wybrany film przekracza 100 MB i jest zbyt duży do bezpiecznego przetworzenia w przeglądarce. Wybierz krótszy lub mniejszy plik.')
  }

  const sourceUrl = URL.createObjectURL(file)
  let sourceMetadata: VideoMetadata
  try {
    sourceMetadata = await readVideoMetadata(sourceUrl)
  } finally {
    URL.revokeObjectURL(sourceUrl)
  }
  if (!Number.isFinite(sourceMetadata.duration) || sourceMetadata.duration <= 0) {
    throw new Error('Nie udało się odczytać długości filmu. Wybierz inny plik.')
  }
  if (!isVideoDurationAllowed(sourceMetadata.duration)) {
    throw new Error('Film jest dłuższy niż 30 sekund. Przytnij go przed dodaniem.')
  }

  const {
    ALL_FORMATS,
    BlobSource,
    BufferTarget,
    Conversion,
    Input,
    Mp4OutputFormat,
    Output,
    Quality,
  } = await import('mediabunny')

  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  try {
    const videoTrack = await input.getPrimaryVideoTrack()
    if (!videoTrack) throw new Error('Plik nie zawiera obsługiwanej ścieżki wideo.')

    const sourceWidth = await videoTrack.getDisplayWidth()
    const sourceHeight = await videoTrack.getDisplayHeight()
    if (!sourceWidth || !sourceHeight) {
      throw new Error('Nie udało się odczytać rozdzielczości filmu.')
    }

    const audioTrack = await input.getPrimaryAudioTrack()
    const initialScale = Math.min(1, MAX_VIDEO_WIDTH / sourceWidth, MAX_VIDEO_HEIGHT / sourceHeight)
    const initialWidth = Math.max(2, Math.floor((sourceWidth * initialScale) / 2) * 2)
    const initialHeight = Math.max(2, Math.floor((sourceHeight * initialScale) / 2) * 2)
    const attempts = [
      { scale: 1, videoBitrate: Math.min(2_500_000, Math.floor((MAX_VIDEO_SIZE * 8 * 0.72) / sourceMetadata.duration)), audioBitrate: 96_000 },
      { scale: 0.75, videoBitrate: Math.min(1_400_000, Math.floor((MAX_VIDEO_SIZE * 8 * 0.55) / sourceMetadata.duration)), audioBitrate: 64_000 },
      { scale: 0.56, videoBitrate: Math.min(700_000, Math.floor((MAX_VIDEO_SIZE * 8 * 0.35) / sourceMetadata.duration)), audioBitrate: 48_000 },
    ]
    let lastSize = 0

    for (let index = 0; index < attempts.length; index += 1) {
      const attempt = attempts[index]
      const width = Math.max(2, Math.floor((initialWidth * attempt.scale) / 2) * 2)
      const height = Math.max(2, Math.floor((initialHeight * attempt.scale) / 2) * 2)
      const target = new BufferTarget()
      const output = new Output({ format: new Mp4OutputFormat(), target })
      const conversion = await Conversion.init({
        input,
        output,
        tracks: 'primary',
        video: {
          codec: 'avc',
          width,
          height,
          fit: 'contain',
          quality: new Quality({ bitrate: Math.max(300_000, attempt.videoBitrate) }),
          forceTranscode: true,
          allowTransformationMetadata: false,
        },
        audio: audioTrack
          ? { codec: 'aac', quality: new Quality({ bitrate: attempt.audioBitrate }), forceTranscode: true }
          : { discard: true },
        copy: false,
        showWarnings: false,
      })

      if (!conversion.isValid) {
        throw new Error('Ta przeglądarka nie obsługuje kodeka potrzebnego do skompresowania filmu.')
      }

      conversion.onProgress = (progress) => {
        onProgress(Math.min(99, Math.max(0, Math.round(((index + progress) / attempts.length) * 100))))
      }

      await conversion.execute()
      lastSize = target.buffer?.byteLength ?? 0
      if (target.buffer && lastSize <= MAX_VIDEO_SIZE) {
        const compressedFile = new File([target.buffer], 'film.mp4', { type: 'video/mp4', lastModified: Date.now() })
        const url = URL.createObjectURL(compressedFile)
        try {
          const metadata = await readVideoMetadata(url)
          if (!isVideoDurationAllowed(metadata.duration)) {
            throw new Error('Skompresowany film przekracza limit 30 sekund. Wybierz krótszy plik.')
          }
          if (metadata.width > MAX_VIDEO_WIDTH || metadata.height > MAX_VIDEO_HEIGHT) {
            throw new Error('Nie udało się zmniejszyć filmu do maksymalnej rozdzielczości 854 × 480 px.')
          }
          onProgress(100)
          return { file: compressedFile, metadata }
        } finally {
          URL.revokeObjectURL(url)
        }
      }
    }

    throw new Error(`Po kompresji film nadal przekracza 15 MB (${formatFileSize(lastSize)}). Wybierz krótszy film lub obniż jego jakość przed dodaniem.`)
  } catch (error) {
    if (error instanceof Error && (
      error.message.includes('30 sekund')
      || error.message.includes('100 MB')
      || error.message.includes('15 MB')
      || error.message.includes('854 × 480')
      || error.message.includes('rozdzielczości')
      || error.message.includes('długości filmu')
      || error.message.includes('ścieżki wideo')
      || error.message.includes('kodeka')
    )) {
      throw error
    }
    throw new Error('Nie udało się skompresować filmu w tej przeglądarce. Format lub kodek może być nieobsługiwany przez urządzenie.')
  } finally {
    input.dispose()
  }
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  if (bytes < 1_048_576) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${(bytes / 1_048_576).toLocaleString('pl-PL', { maximumFractionDigits: 1 })} MB`
}

export function formatDuration(seconds: number) {
  return `${seconds.toLocaleString('pl-PL', { maximumFractionDigits: 1 })} s`
}
