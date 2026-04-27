import { useReducer, useEffect, useRef, useMemo, useCallback } from 'react'

// Stamps-only product surface. Non-stamp fields stay here solely so old
// program rows with those columns round-trip through the reducer cleanly
// without being clobbered to null on save — they're never shown in the UI.
export const DEFAULT_DESIGN = {
  name: '',
  loyalty_type: 'stamp',
  stamps_required: 10,
  reward_title: '',
  reward_description: '',
  reward_icon_url: '',
  card_color: '#10B981',
  text_color: '#FFFFFF',
  card_gradient: null,
  logo_url: '',
  background_url: '',
  barcode_type: 'QR',
  terms: '',
  website_url: '',
  phone: '',
  address: '',
  google_maps_url: '',
  pass_language: 'auto',
  expires_at: null,
  minimal_layout: false,
}

const HISTORY_CAP = 50

function cleanDesign(source) {
  const out = { ...DEFAULT_DESIGN }
  if (!source) return out
  for (const k of Object.keys(DEFAULT_DESIGN)) {
    if (source[k] !== undefined && source[k] !== null) out[k] = source[k]
  }
  return out
}

function hashDesign(design) {
  return JSON.stringify(design)
}

function initialState({ program, shop }) {
  const seeded = cleanDesign({
    ...program,
    name: program?.name || shop?.name || '',
    logo_url: program?.logo_url || shop?.logo_url || '',
  })
  return {
    design: seeded,
    past: [],
    future: [],
    lastSavedHash: program?.id ? hashDesign(seeded) : null,
    error: null,
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD': {
      const next = { ...state.design, [action.field]: action.value }
      if (next[action.field] === state.design[action.field]) return state
      return {
        ...state,
        design: next,
        past: [...state.past.slice(-HISTORY_CAP + 1), state.design],
        future: [],
      }
    }
    case 'SET_MANY': {
      const next = { ...state.design, ...action.patch }
      if (hashDesign(next) === hashDesign(state.design)) return state
      return {
        ...state,
        design: next,
        past: [...state.past.slice(-HISTORY_CAP + 1), state.design],
        future: [],
      }
    }
    case 'LOAD_TEMPLATE':
    case 'LOAD_DESIGN': {
      const loaded = cleanDesign(action.design)
      return {
        design: loaded,
        past: [],
        future: [],
        lastSavedHash: action.markSaved ? hashDesign(loaded) : state.lastSavedHash,
        error: null,
      }
    }
    case 'UNDO': {
      if (state.past.length === 0) return state
      const prev = state.past[state.past.length - 1]
      return {
        ...state,
        design: prev,
        past: state.past.slice(0, -1),
        future: [state.design, ...state.future],
      }
    }
    case 'REDO': {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        ...state,
        design: next,
        past: [...state.past, state.design],
        future: state.future.slice(1),
      }
    }
    case 'MARK_SAVED':
      return { ...state, lastSavedHash: hashDesign(state.design), error: null }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

function draftKey(shopId, programId) {
  return `waya:pass-designer:draft:${shopId || 'unknown'}:${programId || 'new'}`
}

function purgeStaleDrafts() {
  try {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith('waya:pass-designer:draft:')) continue
      const raw = localStorage.getItem(k)
      if (!raw) continue
      try {
        const parsed = JSON.parse(raw)
        if (!parsed.ts || parsed.ts < cutoff) localStorage.removeItem(k)
      } catch { localStorage.removeItem(k) }
    }
  } catch (_) { /* localStorage unavailable in some contexts (private mode, SSR) */ }
}

export default function useDesignState({ program, shop }) {
  const [state, dispatch] = useReducer(reducer, { program, shop }, initialState)
  const shopId = shop?.id
  const programId = program?.id
  const key = useMemo(() => draftKey(shopId, programId), [shopId, programId])
  const saveTimer = useRef(null)

  const isDirty = state.lastSavedHash
    ? hashDesign(state.design) !== state.lastSavedHash
    : hashDesign(state.design) !== hashDesign(cleanDesign({ name: shop?.name || '' }))

  useEffect(() => {
    purgeStaleDrafts()
  }, [])

  useEffect(() => {
    if (!isDirty) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ ts: Date.now(), design: state.design }))
      } catch (_) { /* quota exceeded or disabled — draft saves are best-effort */ }
    }, 500)
    return () => saveTimer.current && clearTimeout(saveTimer.current)
  }, [state.design, isDirty, key])

  const loadDraftFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      return parsed?.design ? { design: parsed.design, ts: parsed.ts } : null
    } catch {
      return null
    }
  }, [key])

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(key) } catch (_) { /* ignore */ }
  }, [key])

  const setField = useCallback((field, value) => dispatch({ type: 'SET_FIELD', field, value }), [])
  const setMany = useCallback((patch) => dispatch({ type: 'SET_MANY', patch }), [])
  const loadTemplate = useCallback((tpl) => dispatch({ type: 'LOAD_TEMPLATE', design: tpl, markSaved: false }), [])
  const loadDesign = useCallback((design, markSaved = false) => dispatch({ type: 'LOAD_DESIGN', design, markSaved }), [])
  const undo = useCallback(() => dispatch({ type: 'UNDO' }), [])
  const redo = useCallback(() => dispatch({ type: 'REDO' }), [])
  const markSaved = useCallback(() => { dispatch({ type: 'MARK_SAVED' }); clearDraft() }, [clearDraft])
  const setError = useCallback((error) => dispatch({ type: 'SET_ERROR', error }), [])
  const clearError = useCallback(() => dispatch({ type: 'CLEAR_ERROR' }), [])

  return {
    design: state.design,
    error: state.error,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    isDirty,
    setField, setMany, loadTemplate, loadDesign,
    undo, redo, markSaved, setError, clearError,
    loadDraftFromStorage, clearDraft,
  }
}
