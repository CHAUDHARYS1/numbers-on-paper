import { supabase } from './supabase'

export async function getProject(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function getProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function createProject(userId, fields) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, ...fields })
    .select()
    .single()
  return { data, error }
}

export async function updateProject(id, fields) {
  const { data, error } = await supabase
    .from('projects')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  return { error }
}

export async function uploadProjectFile(userId, projectId, file, displayName) {
  const fileId = Math.random().toString(36).slice(2, 10)
  const ext = file.name.includes('.') ? file.name.split('.').pop() : ''
  const storagePath = `${userId}/${projectId}/${fileId}${ext ? '.' + ext : ''}`

  const { error } = await supabase.storage
    .from('project-files')
    .upload(storagePath, file, { cacheControl: '3600', upsert: false })

  if (error) return { data: null, error }

  return {
    data: {
      id: fileId,
      name: displayName || file.name,
      path: storagePath,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploaded_at: new Date().toISOString(),
    },
    error: null,
  }
}

export async function deleteProjectFile(path) {
  const { error } = await supabase.storage.from('project-files').remove([path])
  return { error }
}

export async function getProjectFileUrl(path, forDownload = false) {
  const options = forDownload ? { download: true } : {}
  const { data, error } = await supabase.storage
    .from('project-files')
    .createSignedUrl(path, 3600, options)
  return { url: data?.signedUrl ?? null, error }
}
