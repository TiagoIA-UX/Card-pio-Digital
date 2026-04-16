import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/shared/supabase/admin'
import {
  validatePublicationPayload,
  type DeliveryPublicationPayload,
} from '@/lib/domains/publish/publish.validation'

type DraftVersionRow = {
  id: string
  delivery_id: string
  version_number: number
  payload: DeliveryPublicationPayload
  hash: string
  status: 'editing' | 'saved' | 'validated' | 'invalid' | 'ready_to_publish'
}

type ReleaseVersionRow = {
  id: string
  delivery_id: string
  version_number: number
}

export class PublishServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'PublishServiceError'
  }
}

function computePayloadHash(payload: DeliveryPublicationPayload): string {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

async function assertDeliveryOwnership(deliveryId: string, userId: string) {
  const supabase = createAdminClient()
  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('id, owner_id, user_id')
    .eq('id', deliveryId)
    .maybeSingle()

  if (error) {
    throw new PublishServiceError('Erro ao validar delivery.', 500)
  }

  if (!restaurant) {
    throw new PublishServiceError('Delivery não encontrado.', 404)
  }

  if (restaurant.owner_id !== userId && restaurant.user_id !== userId) {
    throw new PublishServiceError('Sem permissão para publicar este delivery.', 403)
  }
}

async function getDraftVersion(deliveryId: string, draftVersionId: string) {
  const supabase = createAdminClient()
  const { data: draft, error } = await supabase
    .from('delivery_draft_versions')
    .select('id, delivery_id, version_number, payload, hash, status')
    .eq('id', draftVersionId)
    .eq('delivery_id', deliveryId)
    .maybeSingle()

  if (error) {
    throw new PublishServiceError('Erro ao carregar rascunho.', 500)
  }

  if (!draft) {
    throw new PublishServiceError('Rascunho não encontrado.', 404)
  }

  return draft as DraftVersionRow
}

export interface PublishDeliveryInput {
  deliveryId: string
  draftVersionId: string
  userId: string
}

export interface PublishDeliveryResult {
  success: true
  releaseVersionId: string
  versionNumber: number
}

export async function publishDeliveryVersion({
  deliveryId,
  draftVersionId,
  userId,
}: PublishDeliveryInput): Promise<PublishDeliveryResult> {
  await assertDeliveryOwnership(deliveryId, userId)

  const draft = await getDraftVersion(deliveryId, draftVersionId)

  const validation = validatePublicationPayload(draft.payload)
  if (!validation.success) {
    const supabase = createAdminClient()
    await supabase.from('delivery_draft_versions').update({ status: 'invalid' }).eq('id', draft.id)
    throw new PublishServiceError('Falha na validação da publicação.', 422, {
      errors: validation.errors,
    })
  }

  const payloadHash = computePayloadHash(draft.payload)
  const supabase = createAdminClient()

  const { data: release, error: releaseError } = await supabase
    .from('delivery_release_versions')
    .insert({
      delivery_id: deliveryId,
      version_number: draft.version_number,
      payload: draft.payload,
      hash: payloadHash,
      status: 'candidate',
    })
    .select('id, delivery_id, version_number')
    .single()

  if (releaseError || !release) {
    throw new PublishServiceError('Erro ao criar release.', 500, {
      message: releaseError?.message,
    })
  }

  const releaseRow = release as ReleaseVersionRow

  const { error: currentVersionError } = await supabase.from('delivery_current_version').upsert(
    {
      delivery_id: deliveryId,
      release_version_id: releaseRow.id,
    },
    { onConflict: 'delivery_id' }
  )

  if (currentVersionError) {
    await supabase
      .from('delivery_release_versions')
      .update({ status: 'failed' })
      .eq('id', releaseRow.id)

    throw new PublishServiceError('Erro ao ativar release publicada.', 500, {
      message: currentVersionError.message,
    })
  }

  const { error: publishError } = await supabase
    .from('delivery_release_versions')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', releaseRow.id)

  if (publishError) {
    throw new PublishServiceError('Release criada, mas falhou ao finalizar publicação.', 500, {
      message: publishError.message,
    })
  }

  await supabase
    .from('delivery_draft_versions')
    .update({ status: 'validated', hash: payloadHash })
    .eq('id', draft.id)

  return {
    success: true,
    releaseVersionId: releaseRow.id,
    versionNumber: releaseRow.version_number,
  }
}
