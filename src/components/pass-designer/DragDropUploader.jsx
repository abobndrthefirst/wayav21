import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

const UploadIcon = () => (
  <svg className="pd-uploader-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
  </svg>
)

export default function DragDropUploader({ label, hint, accept = 'image/png,image/jpeg', url, onUrlChange, shopId, kind, T, maxSizeMB = 2 }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const upload = async (file) => {
    if (!file) return
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(T(`File too large (max ${maxSizeMB}MB)`, `الملف كبير جداً (الحد ${maxSizeMB}MB)`))
      return
    }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${shopId}/${kind}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('program-assets').upload(path, file, { upsert: true })
    if (error) { alert(error.message); setUploading(false); return }
    const { data } = supabase.storage.from('program-assets').getPublicUrl(path)
    onUrlChange(data.publicUrl)
    setUploading(false)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) upload(file)
  }

  const hasFile = !!url

  return (
    <div className="pd-field">
      <label>{label}</label>
      <AnimatePresence mode="wait">
        {uploading ? (
          <motion.div key="spinner" className="pd-uploader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="pd-uploader-spinner" />
          </motion.div>
        ) : hasFile ? (
          <motion.div
            key="thumb"
            className="pd-uploader has-file"
            initial={{ opacity: 0, scale: .92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: .92 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <img src={url} alt="" className="pd-uploader-thumb" />
            <button type="button" className="pd-uploader-remove" onClick={() => onUrlChange('')}>×</button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className={`pd-uploader ${dragging ? 'dragging' : ''}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <UploadIcon />
            <span className="pd-uploader-text">{T('Drag & drop or click to upload', 'اسحب وأفلت أو انقر للرفع')}</span>
            <span className="pd-uploader-formats">{hint || 'PNG, JPG (max 2MB)'}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <input
        type="file"
        accept={accept}
        ref={inputRef}
        style={{ display: 'none' }}
        onChange={(e) => { upload(e.target.files?.[0]); e.target.value = '' }}
      />
    </div>
  )
}
