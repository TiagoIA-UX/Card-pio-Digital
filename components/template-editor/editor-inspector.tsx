'use client'

import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import { ImageUploader } from '@/components/shared/image-uploader'
import { HERO_SLOGAN_PRESETS, type HeroSloganPresetId } from '@/lib/restaurant-customization'
import { buildGoogleMapsLinks } from '@/lib/google-maps'
import type { FormState } from '@/lib/editor/types'

interface EditorInspectorProps {
  form: FormState
  onFormChange: (patch: Partial<FormState>) => void
  displayCategories: string[]
  editingCategory: { old: string; value: string } | null
  onSetEditingCategory: (value: { old: string; value: string } | null) => void
  onEditCategory: (oldName: string, newName: string) => void
  onDeleteCategory: (name: string) => void
  newCategoryName: string
  onSetNewCategoryName: (value: string) => void
  onAddCategory: () => void
  logoError: string | null
  bannerError: string | null
  onLogoChange: (value: string) => void
  onBannerChange: (value: string) => void
}

export function EditorInspector({
  form,
  onFormChange,
  displayCategories,
  editingCategory,
  onSetEditingCategory,
  onEditCategory,
  onDeleteCategory,
  newCategoryName,
  onSetNewCategoryName,
  onAddCategory,
  logoError,
  bannerError,
  onLogoChange,
  onBannerChange,
}: EditorInspectorProps) {
  const mapLinks = buildGoogleMapsLinks({
    address: form.endereco_texto,
    mapUrl: form.google_maps_url,
  })

  return (
    <aside className="border-border bg-muted/20 flex w-full shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r lg:w-80 xl:w-95">
      <div className="space-y-6 p-3 sm:p-4">
        {/* Negócio */}
        <section>
          <h3 className="text-foreground mb-3 text-sm font-semibold">Negócio</h3>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">Nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => onFormChange({ nome: e.target.value })}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Nome do estabelecimento"
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">WhatsApp</label>
              <input
                type="tel"
                value={form.telefone}
                onChange={(e) => onFormChange({ telefone: e.target.value })}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">Slogan</label>
              <input
                type="text"
                value={form.slogan}
                onChange={(e) => onFormChange({ slogan: e.target.value })}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Ex: O melhor da cidade"
              />
            </div>
          </div>
        </section>

        {/* Título e descrição da seção de produtos */}
        <section>
          <h3 className="text-foreground mb-3 text-sm font-semibold">
            Título e descrição da seção de produtos
          </h3>
          <p className="text-muted-foreground mb-3 text-xs">
            Textos que aparecem acima da lista de categorias no canal digital.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">Título</label>
              <input
                type="text"
                value={form.sectionTitle}
                onChange={(e) => onFormChange({ sectionTitle: e.target.value })}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Ex: Pizzas, bordas e bebidas"
              />
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">Descrição</label>
              <textarea
                rows={2}
                value={form.sectionDescription}
                onChange={(e) => onFormChange({ sectionDescription: e.target.value })}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Ex: Encontre tudo em uma estrutura fácil de percorrer e monte seu pedido em poucos cliques."
              />
            </div>
          </div>
        </section>

        {/* Logo e Banner */}
        <section>
          <h3 className="text-foreground mb-3 text-sm font-semibold">Logo e Banner</h3>
          <div className="space-y-3">
            <div>
              <ImageUploader
                label="Logo"
                value={form.logo_url}
                folder="logos"
                aspect="1:1"
                allowUrlInput={false}
                onChange={onLogoChange}
              />
              {logoError && <p className="mt-1 text-xs text-red-600">❌ {logoError}</p>}
            </div>
            <div>
              <ImageUploader
                label="Banner"
                value={form.banner_url}
                folder="banners"
                aspect="3:1"
                allowUrlInput={false}
                onChange={onBannerChange}
              />
              {bannerError && <p className="mt-1 text-xs text-red-600">❌ {bannerError}</p>}
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">Frase do banner</label>
              <p className="text-muted-foreground mb-2 text-xs">
                Frase que aparece sob o nome. Escolha uma pronta ou personalize.
              </p>
              <select
                title="Selecionar frase do banner"
                aria-label="Selecionar frase do banner"
                value={form.heroSloganPreset}
                onChange={(e) =>
                  onFormChange({ heroSloganPreset: e.target.value as HeroSloganPresetId })
                }
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
              >
                {HERO_SLOGAN_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
                <option value="custom">Personalizado</option>
              </select>
              {form.heroSloganPreset === 'custom' && (
                <input
                  type="text"
                  value={form.heroDescription}
                  onChange={(e) => onFormChange({ heroDescription: e.target.value })}
                  className="border-border bg-background text-foreground mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                  placeholder="Sua frase personalizada"
                />
              )}
            </div>
          </div>
        </section>

        {/* Rodapé e Contato */}
        <section>
          <h3 className="text-foreground mb-3 text-sm font-semibold">Rodapé e Contato</h3>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">Endereço</label>
              <input
                type="text"
                value={form.endereco_texto}
                onChange={(e) => onFormChange({ endereco_texto: e.target.value })}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="Av. Exemplo, 123 - Bairro - Cidade/SP"
              />
              <p className="text-muted-foreground mt-1 text-[10px]">
                Aparece no rodapé do canal digital.
              </p>
            </div>
            <div>
              <label className="text-muted-foreground mb-1 block text-xs">
                Link do Google Maps
              </label>
              <input
                type="url"
                value={form.google_maps_url}
                onChange={(e) => onFormChange({ google_maps_url: e.target.value })}
                className="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm"
                placeholder="https://maps.google.com/?q=Seu+Delivery"
              />
              <p className="text-muted-foreground mt-1 text-[10px]">
                No Google Maps, clique em &quot;Compartilhar&quot; → &quot;Copiar link&quot;.
              </p>
            </div>
            {(form.google_maps_url || form.endereco_texto) && (
              <div className="border-border overflow-hidden rounded-lg border">
                {mapLinks.embedUrl ? (
                  <iframe
                    title="Pré-visualização do mapa"
                    src={mapLinks.embedUrl}
                    className="h-32 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                ) : (
                  <div className="bg-muted text-muted-foreground flex h-32 items-center justify-center px-3 text-center text-xs">
                    Este link não permite pré-visualização incorporada. Use o botão abaixo para
                    abrir no Google Maps.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Categorias */}
        <section>
          <h3 className="text-foreground mb-3 text-sm font-semibold">Categorias</h3>
          <p className="text-muted-foreground mb-3 text-xs">
            Adicione, edite ou exclua categorias. Os produtos são organizados por categoria no canal
            digital.
          </p>
          <div className="space-y-2">
            {displayCategories.map((cat) => (
              <div
                key={cat}
                className="border-border bg-background flex items-center gap-2 rounded-lg border px-3 py-2"
              >
                {editingCategory?.old === cat ? (
                  <>
                    <input
                      type="text"
                      value={editingCategory.value}
                      onChange={(e) =>
                        onSetEditingCategory(
                          editingCategory ? { ...editingCategory, value: e.target.value } : null
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onEditCategory(cat, editingCategory.value)
                        if (e.key === 'Escape') onSetEditingCategory(null)
                      }}
                      title="Editar nome da categoria"
                      aria-label="Editar nome da categoria"
                      className="border-border text-foreground min-w-0 flex-1 rounded border px-2 py-1 text-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => onEditCategory(cat, editingCategory.value)}
                      className="text-primary shrink-0 p-1"
                      title="Salvar"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSetEditingCategory(null)}
                      className="text-muted-foreground shrink-0 p-1"
                      title="Cancelar"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-foreground min-w-0 flex-1 truncate text-sm">{cat}</span>
                    <button
                      type="button"
                      onClick={() => onSetEditingCategory({ old: cat, value: cat })}
                      className="text-muted-foreground hover:text-foreground shrink-0 rounded p-1"
                      title="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCategory(cat)}
                      className="text-muted-foreground hover:text-destructive shrink-0 rounded p-1"
                      title="Excluir"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => onSetNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onAddCategory()}
                placeholder="Nova categoria"
                className="border-border bg-background text-foreground min-w-0 flex-1 rounded-lg border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={onAddCategory}
                className="bg-primary text-primary-foreground shrink-0 rounded-lg px-3 py-2"
                title="Adicionar"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </div>
    </aside>
  )
}
