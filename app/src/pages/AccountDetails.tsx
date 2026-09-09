import React, { useEffect, useMemo, useState } from 'react'
import { LoginButton } from '../components/LoginButton'
import { MainMenu } from '../components/MainMenu'
import { UserAvatar } from '../components/UserAvatar'
import { getMyAccountProfile, logUserEvent, updateMyAccountProfile } from '../services/api'
import { UserAccountProfile } from '../types'

const MAX_CANVAS_SIZE = 256

const emptyForm = {
  first_name: '',
  last_name: '',
  display_name: '',
  job_title: '',
  department: '',
  timezone: '',
  phone: '',
  bio: '',
}

const normalizeFileToDataUrl = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      resolve(result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

const cropImageToSquareDataUrl = async (
  sourceDataUrl: string,
  zoom: number,
  panX: number,
  panY: number,
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = MAX_CANVAS_SIZE
      canvas.height = MAX_CANVAS_SIZE
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not initialize image canvas'))
        return
      }

      const baseScale = Math.max(MAX_CANVAS_SIZE / img.width, MAX_CANVAS_SIZE / img.height)
      const drawScale = baseScale * zoom
      const drawWidth = img.width * drawScale
      const drawHeight = img.height * drawScale
      const x = (MAX_CANVAS_SIZE - drawWidth) / 2 + panX
      const y = (MAX_CANVAS_SIZE - drawHeight) / 2 + panY

      ctx.clearRect(0, 0, MAX_CANVAS_SIZE, MAX_CANVAS_SIZE)
      ctx.drawImage(img, x, y, drawWidth, drawHeight)

      resolve(canvas.toDataURL('image/jpeg', 0.9))
    }
    img.onerror = () => reject(new Error('Unable to load selected avatar image'))
    img.src = sourceDataUrl
  })
}

export const AccountDetails: React.FC = () => {
  const [profile, setProfile] = useState<UserAccountProfile | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const [selectedImageDataUrl, setSelectedImageDataUrl] = useState<string | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const account = await getMyAccountProfile()
        setProfile(account)
        setAvatarPreview(account.avatar_data_url || null)
        setForm({
          first_name: account.first_name || '',
          last_name: account.last_name || '',
          display_name: account.display_name || '',
          job_title: account.job_title || '',
          department: account.department || '',
          timezone: account.timezone || '',
          phone: account.phone || '',
          bio: account.bio || '',
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load account details')
      }
    }

    void load()
  }, [])

  const displayName = useMemo(() => {
    if (form.display_name.trim()) {
      return form.display_name.trim()
    }
    return `${form.first_name} ${form.last_name}`.trim()
  }, [form.display_name, form.first_name, form.last_name])

  const onAvatarFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      setError('')
      const dataUrl = await normalizeFileToDataUrl(file)
      setSelectedImageDataUrl(dataUrl)
      setZoom(1)
      setPanX(0)
      setPanY(0)
      setStatusMessage('Avatar selected. Use controls to crop, then apply.')
    } catch {
      setError('Unable to read selected avatar file')
    }
  }

  const applyCrop = async () => {
    if (!selectedImageDataUrl) {
      return
    }

    try {
      const croppedDataUrl = await cropImageToSquareDataUrl(selectedImageDataUrl, zoom, panX, panY)
      setAvatarPreview(croppedDataUrl)
      setStatusMessage('Avatar crop applied. Save account details to persist changes.')
      await logUserEvent({ action: 'avatar_crop_applied', target: 'account_details' })
    } catch {
      setError('Unable to apply avatar crop')
    }
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setStatusMessage('')
    setIsSaving(true)

    try {
      const saved = await updateMyAccountProfile({
        ...form,
        avatar_data_url: avatarPreview,
      })
      setProfile(saved)
      setStatusMessage('Account details updated.')
      await logUserEvent({ action: 'account_details_saved', target: 'account_details' })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save account details')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,166,166,0.08),transparent_28%),linear-gradient(180deg,#eef3f7_0%,#e7edf2_100%)] text-slate-800">
      <header className="relative z-[200] border-b border-white/70 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <img src="/sextant-logo-horiz.svg" alt="Sextant" className="h-8 w-auto" />
          <LoginButton />
        </div>
      </header>

      <MainMenu breadcrumb="Account / Details" />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {(statusMessage || error) && (
          <section className="surface-panel rounded-[1.5rem] p-5">
            <p className={`text-sm font-semibold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
              {error || statusMessage}
            </p>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="surface-panel rounded-[2rem] p-7">
            <p className="section-kicker mb-2">Avatar</p>
            <h1 className="text-3xl font-semibold text-slate-900">Account details</h1>

            <div className="mt-6 flex items-center gap-4">
              <UserAvatar
                username={profile?.username}
                displayName={displayName}
                avatarDataUrl={avatarPreview}
                sizeClassName="h-20 w-20"
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">{displayName || profile?.username || 'User'}</p>
                <p className="text-sm text-slate-600">{profile?.email || ''}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <label className="section-kicker block" htmlFor="avatar-upload">Upload avatar</label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={onAvatarFileSelected} />

              {selectedImageDataUrl && (
                <div className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <p className="text-sm font-semibold text-slate-800">Crop preview</p>
                  <div className="mt-3 h-48 w-48 overflow-hidden rounded-2xl border border-slate-300 bg-slate-100">
                    <img
                      src={selectedImageDataUrl}
                      alt="Avatar crop preview"
                      className="h-full w-full object-cover"
                      style={{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})` }}
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Zoom</label>
                    <input type="range" min={1} max={2.5} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full" />

                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Pan X</label>
                    <input type="range" min={-80} max={80} step={1} value={panX} onChange={(event) => setPanX(Number(event.target.value))} className="w-full" />

                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Pan Y</label>
                    <input type="range" min={-80} max={80} step={1} value={panY} onChange={(event) => setPanY(Number(event.target.value))} className="w-full" />
                  </div>

                  <button type="button" className="button-secondary mt-4" onClick={() => void applyCrop()}>
                    Apply crop
                  </button>
                </div>
              )}
            </div>
          </article>

          <article className="surface-panel rounded-[2rem] p-7">
            <form className="space-y-4" onSubmit={handleSave}>
              <p className="section-kicker">Editable Profile Fields</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="first-name">First name</label>
                  <input id="first-name" className="input-field" value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} />
                </div>
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="last-name">Last name</label>
                  <input id="last-name" className="input-field" value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} />
                </div>
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="display-name">Display name</label>
                <input id="display-name" className="input-field" value={form.display_name} onChange={(event) => setForm({ ...form, display_name: event.target.value })} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="job-title">Job title</label>
                  <input id="job-title" className="input-field" value={form.job_title} onChange={(event) => setForm({ ...form, job_title: event.target.value })} />
                </div>
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="department">Department</label>
                  <input id="department" className="input-field" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="timezone">Timezone</label>
                  <input id="timezone" className="input-field" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
                </div>
                <div>
                  <label className="section-kicker mb-2 block" htmlFor="phone">Phone</label>
                  <input id="phone" className="input-field" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                </div>
              </div>

              <div>
                <label className="section-kicker mb-2 block" htmlFor="bio">Bio</label>
                <textarea id="bio" className="input-field min-h-[120px]" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} />
              </div>

              <button type="submit" className="button-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save account details'}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white/65 p-4">
              <p className="section-kicker mb-2">Keycloak Read-Only Identity</p>
              <dl className="space-y-2 text-sm text-slate-700">
                <div>
                  <dt className="font-semibold text-slate-900">Subject</dt>
                  <dd>{profile?.keycloak_subject || '-'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Username</dt>
                  <dd>{profile?.username || '-'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Email</dt>
                  <dd>{profile?.email || '-'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Roles</dt>
                  <dd>{(profile?.roles || []).join(', ') || '-'}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-900">Issuer</dt>
                  <dd>{profile?.keycloak_issuer || '-'}</dd>
                </div>
              </dl>

              {profile?.keycloak_account_url && (
                <a
                  href={profile.keycloak_account_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm font-semibold text-[var(--north-atlantic-blue)] hover:underline"
                >
                  Open Keycloak account console
                </a>
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
