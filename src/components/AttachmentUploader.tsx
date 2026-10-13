import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Video, X } from 'lucide-react'
import {
  compressPhoto,
  formatDuration,
  formatFileSize,
  MAX_PHOTOS,
  MAX_PHOTOS_SIZE,
  MAX_TOTAL_SIZE,
  MAX_VIDEO_SIZE,
  type PhotoAttachment,
  type RepairAttachments,
  compressVideo,
  type VideoAttachment,
} from '../utils/attachments'

interface AttachmentUploaderProps {
  onChange: (attachments: RepairAttachments, processing: boolean) => void
}

function fileIdentity(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`
}

function photoCountLabel(count: number) {
  if (count === 1) return '1 zdjęcie'
  if (count >= 2 && count <= 4) return `${count} zdjęcia`
  return `${count} zdjęć`
}

function videoCountLabel(count: number) {
  if (count === 1) return '1 film'
  if (count >= 2 && count <= 4) return `${count} filmy`
  return `${count} filmów`
}

function AttachmentUploader({ onChange }: AttachmentUploaderProps) {
  const [photos, setPhotos] = useState<PhotoAttachment[]>([])
  const [video, setVideo] = useState<VideoAttachment | null>(null)
  const [processingCount, setProcessingCount] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [photoDragActive, setPhotoDragActive] = useState(false)
  const [videoDragActive, setVideoDragActive] = useState(false)
  const [videoProgress, setVideoProgress] = useState<number | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const photosRef = useRef(photos)
  const videoRef = useRef(video)
  const pendingPhotoCountRef = useRef(0)
  const processingIdsRef = useRef(new Set<string>())
  const processingVideoRef = useRef(false)
  const previewUrlsRef = useRef(new Set<string>())
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    photosRef.current = photos
    videoRef.current = video
    onChangeRef.current({ photos, video }, processingCount > 0)
  }, [photos, video, processingCount])

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    previewUrlsRef.current.clear()
  }, [])

  const addError = (message: string) => {
    setErrors((current) => current.includes(message) ? current : [...current, message])
  }

  const makePreviewUrl = (file: File) => {
    const url = URL.createObjectURL(file)
    previewUrlsRef.current.add(url)
    return url
  }

  const removePreviewUrl = (url: string) => {
    URL.revokeObjectURL(url)
    previewUrlsRef.current.delete(url)
  }

  const handlePhotoFiles = async (files: FileList | File[]) => {
    setErrors([])
    for (const file of Array.from(files)) {
      const sourceId = fileIdentity(file)
      if (processingIdsRef.current.has(sourceId) || photosRef.current.some((photo) => photo.sourceId === sourceId)) {
        addError('To zdjęcie zostało już dodane lub jest właśnie przetwarzane.')
        continue
      }
      if (photosRef.current.length + pendingPhotoCountRef.current >= MAX_PHOTOS) {
        addError('Możesz dodać maksymalnie 5 zdjęć.')
        continue
      }

      processingIdsRef.current.add(sourceId)
      pendingPhotoCountRef.current += 1
      setProcessingCount((current) => current + 1)
      try {
        const processedFile = await compressPhoto(file)
        const currentPhotoSize = photosRef.current.reduce((total, photo) => total + photo.file.size, 0)
        const currentVideoSize = videoRef.current?.file.size ?? 0
        if (currentPhotoSize + processedFile.size > MAX_PHOTOS_SIZE) {
          throw new Error('Łączny rozmiar zdjęć przekroczyłby limit 5 MB.')
        }
        if (currentPhotoSize + currentVideoSize + processedFile.size > MAX_TOTAL_SIZE) {
          throw new Error('Łączny rozmiar załączników przekroczyłby limit 20 MB.')
        }

        const photo: PhotoAttachment = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          sourceId,
          originalName: file.name,
          file: processedFile,
          previewUrl: makePreviewUrl(processedFile),
        }
        const nextPhotos = [...photosRef.current, photo]
        photosRef.current = nextPhotos
        setPhotos(nextPhotos)
      } catch (error) {
        addError(error instanceof Error ? error.message : 'Nie udało się przygotować zdjęcia.')
      } finally {
        pendingPhotoCountRef.current -= 1
        processingIdsRef.current.delete(sourceId)
        setProcessingCount((current) => current - 1)
      }
    }
  }

  const handleVideoFiles = async (files: FileList | File[]) => {
    setErrors([])
    const file = Array.from(files)[0]
    if (!file) return
    if (files.length > 1) addError('Możesz dodać tylko jeden film. Wybrany zostanie pierwszy plik.')
    if (processingVideoRef.current) {
      addError('Film jest już sprawdzany. Poczekaj na zakończenie weryfikacji przed wyborem kolejnego.')
      return
    }

    processingVideoRef.current = true
    setVideoProgress(0)
    setProcessingCount((current) => current + 1)
    try {
      const { file: processedFile, metadata } = await compressVideo(file, setVideoProgress)
      const currentPhotoSize = photosRef.current.reduce((total, photo) => total + photo.file.size, 0)
      if (currentPhotoSize + processedFile.size > MAX_TOTAL_SIZE) {
        throw new Error('Łączny rozmiar załączników przekroczyłby limit 20 MB.')
      }

      const nextVideo: VideoAttachment = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        originalName: file.name,
        file: processedFile,
        previewUrl: makePreviewUrl(processedFile),
        ...metadata,
      }
      const previousVideo = videoRef.current
      videoRef.current = nextVideo
      setVideo(nextVideo)
      if (previousVideo) removePreviewUrl(previousVideo.previewUrl)
    } catch (error) {
      addError(error instanceof Error ? error.message : 'Nie udało się sprawdzić filmu.')
    } finally {
      processingVideoRef.current = false
      setVideoProgress(null)
      setProcessingCount((current) => current - 1)
    }
  }

  const removePhoto = (photo: PhotoAttachment) => {
    removePreviewUrl(photo.previewUrl)
    const nextPhotos = photosRef.current.filter((item) => item.id !== photo.id)
    photosRef.current = nextPhotos
    setPhotos(nextPhotos)
    setErrors([])
  }

  const removeVideo = () => {
    if (videoRef.current) removePreviewUrl(videoRef.current.previewUrl)
    videoRef.current = null
    setVideo(null)
    setErrors([])
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  const totalSize = photos.reduce((total, photo) => total + photo.file.size, 0) + (video?.file.size ?? 0)
  const photosSize = photos.reduce((total, photo) => total + photo.file.size, 0)
  const isProcessing = processingCount > 0

  return (
    <section className="attachment-section" aria-labelledby="attachment-heading" aria-busy={isProcessing}>
      <div className="attachment-heading">
        <h3 id="attachment-heading">Zdjęcia i film usterki</h3>
        <p>Dodaj zdjęcia lub krótki film przedstawiający problem z telewizorem. Dzięki temu łatwiej będzie nam wstępnie ocenić usterkę.</p>
      </div>

      <div className="attachment-uploaders">
        <div className="attachment-group">
          <div className="attachment-label-row">
            <label className="sr-only" htmlFor="photo-picker">Dodaj zdjęcia</label>
            <span>{photos.length} / {MAX_PHOTOS}</span>
          </div>
          {photos.length + pendingPhotoCountRef.current < MAX_PHOTOS && (
            <div
              className={`attachment-dropzone${photoDragActive ? ' is-dragging' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setPhotoDragActive(true) }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPhotoDragActive(false)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setPhotoDragActive(false)
                void handlePhotoFiles(event.dataTransfer.files)
              }}
            >
              <ImagePlus size={20} aria-hidden="true" />
              <span>Przeciągnij zdjęcia tutaj lub wybierz pliki</span>
              <button type="button" className="attachment-pick-button" onClick={() => photoInputRef.current?.click()}>
                Wybierz zdjęcia
              </button>
              <input
                ref={photoInputRef}
                id="photo-picker"
                className="attachment-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp,.heic,.heif"
                multiple
                aria-label="Wybierz zdjęcia"
                onChange={(event) => {
                  if (event.currentTarget.files) void handlePhotoFiles(event.currentTarget.files)
                  event.currentTarget.value = ''
                }}
              />
              <span className="attachment-instruction">Do 5 zdjęć. Maksymalny dłuższy bok po kompresji: 854 px. Maksymalnie 1 MB na zdjęcie.</span>
            </div>
          )}
          <div className={`attachment-extras${photos.length + pendingPhotoCountRef.current >= MAX_PHOTOS ? ' is-full' : ''}`}>
          {photos.length > 0 && (
            <div className="photo-preview-grid">
              {photos.map((photo) => (
                <article className="photo-preview" key={photo.id}>
                  <img src={photo.previewUrl} alt={`Podgląd zdjęcia: ${photo.originalName}`} />
                  <div className="photo-preview-info">
                    <span className="attachment-filename" title={photo.originalName}>{photo.originalName}</span>
                    <span>{formatFileSize(photo.file.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="attachment-remove"
                    aria-label={`Usuń zdjęcie ${photo.originalName}`}
                    onClick={() => removePhoto(photo)}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          )}
          {photos.length + pendingPhotoCountRef.current >= MAX_PHOTOS && <p className="attachment-limit">Osiągnięto limit 5 zdjęć.</p>}
          {isProcessing && <p className="attachment-processing" role="status">Przygotowywanie zdjęcia lub filmu…</p>}
          </div>
        </div>

        <div className="attachment-group">
          <div className="attachment-label-row">
            <label className="sr-only" htmlFor="video-picker">Dodaj krótki film</label>
            <span>{video ? 1 : 0} / 1</span>
          </div>
          {!video && videoProgress === null && (
            <div
              className={`attachment-dropzone${videoDragActive ? ' is-dragging' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setVideoDragActive(true) }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setVideoDragActive(false)
              }}
              onDrop={(event) => {
                event.preventDefault()
                setVideoDragActive(false)
                void handleVideoFiles(event.dataTransfer.files)
              }}
            >
              <Video size={20} aria-hidden="true" />
              <span>Przeciągnij film tutaj lub wybierz plik</span>
              <button type="button" className="attachment-pick-button" onClick={() => videoInputRef.current?.click()}>
                Wybierz film
              </button>
              <input
                ref={videoInputRef}
                id="video-picker"
                className="attachment-input"
                type="file"
                accept="video/mp4,video/quicktime,.mp4,.mov,.m4v,.webm"
                aria-label="Wybierz film"
                onChange={(event) => {
                  if (event.currentTarget.files) void handleVideoFiles(event.currentTarget.files)
                  event.currentTarget.value = ''
                }}
              />
              <span className="attachment-instruction">Jeden film do 30 sekund. Pliki do 100 MB zostaną skompresowane w przeglądarce do maksymalnie 854 × 480 px i 15 MB. Zalecany format MP4.</span>
            </div>
          )}
          <div className={`attachment-extras${video || videoProgress !== null ? ' is-full' : ''}`}>
          {videoProgress !== null && (
            <div className="video-processing" role="status" aria-live="polite">
              <span>Kompresowanie filmu w przeglądarce… {videoProgress}%</span>
              <progress value={videoProgress} max={100} aria-label="Postęp kompresji filmu" />
            </div>
          )}
          {video && (
            <article className="video-preview">
              <video src={video.previewUrl} controls preload="metadata" aria-label={`Podgląd filmu ${video.originalName}`} />
              <div className="video-preview-info">
                <span className="attachment-filename" title={video.originalName}>{video.originalName}</span>
                <span>{formatDuration(video.duration)} · {video.width} × {video.height} px · {formatFileSize(video.file.size)}</span>
              </div>
              <button type="button" className="attachment-remove" aria-label="Usuń film" onClick={removeVideo}>
                <X size={15} aria-hidden="true" />
              </button>
            </article>
          )}
          </div>
        </div>
      </div>

      <p className="attachment-summary" aria-live="polite">
        Załączniki: {photoCountLabel(photos.length)}, {videoCountLabel(video ? 1 : 0)} · {formatFileSize(totalSize)} / 20 MB
      </p>
      {photosSize > MAX_PHOTOS_SIZE && <p className="attachment-error" role="alert">Łączny rozmiar zdjęć przekracza limit 5 MB.</p>}
      {video && video.file.size > MAX_VIDEO_SIZE && <p className="attachment-error" role="alert">Film przekracza limit 15 MB.</p>}
      {errors.length > 0 && (
        <ul className="attachment-errors" role="alert" aria-live="assertive">
          {errors.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
    </section>
  )
}

export default AttachmentUploader
