'use client'

import Link from 'next/link'
import { Loader2, ShieldAlert } from 'lucide-react'
import { CardapioEditorPreview } from '@/components/template-editor/cardapio-editor-preview'
import { EditorHeader } from '@/components/template-editor/editor-header'
import { EditorInspector } from '@/components/template-editor/editor-inspector'
import { cn } from '@/lib/utils'
import { getRestaurantScopedHref } from '@/lib/active-restaurant'
import { useEditorState } from '@/lib/editor/use-editor-state'
import { usePanelAccess } from '@/lib/panel/panel-context'
import type { FormState } from '@/lib/editor/types'

export default function EditorVisualPage() {
  const { capabilities } = usePanelAccess()
  const editor = useEditorState()

  const handleFormChange = (patch: Partial<FormState>) => {
    editor.setForm((prev) => ({ ...prev, ...patch }))
  }

  if (editor.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!capabilities.canAccessVisualEditor) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <ShieldAlert className="text-destructive h-10 w-10" />
        <p className="text-muted-foreground text-center">
          Acesso ao editor não disponível. Verifique se sua compra foi concluída.
        </p>
        <Link href="/templates" className="text-primary hover:underline">
          Ver templates disponíveis
        </Link>
      </div>
    )
  }

  if (!editor.restaurant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground">Delivery não encontrado.</p>
        <Link href={getRestaurantScopedHref('/painel')} className="text-primary hover:underline">
          Voltar ao painel
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] min-w-0 flex-col overflow-hidden lg:h-screen">
      <EditorHeader
        panelHidden={editor.panelHidden}
        onTogglePanel={() => editor.setPanelHidden((p) => !p)}
        restaurantId={editor.restaurant?.id}
        cardapioUrl={editor.cardapioUrl}
        copied={editor.copied}
        onCopyAndPublish={editor.copyAndPublish}
      />

      <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {!editor.panelHidden && (
          <EditorInspector
            form={editor.form}
            onFormChange={handleFormChange}
            displayCategories={editor.displayCategories}
            editingCategory={editor.editingCategory}
            onSetEditingCategory={editor.setEditingCategory}
            onEditCategory={editor.handleEditCategory}
            onDeleteCategory={editor.handleDeleteCategory}
            newCategoryName={editor.newCategoryName}
            onSetNewCategoryName={editor.setNewCategoryName}
            onAddCategory={editor.handleAddCategory}
            logoError={editor.logoError}
            bannerError={editor.bannerError}
            onLogoChange={editor.handleLogoChange}
            onBannerChange={editor.handleBannerChange}
          />
        )}

        <main className="bg-muted/30 flex min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-2 sm:p-4">
          {editor.previewRestaurant && (
            <div
              className={cn(
                'mx-auto w-full min-w-0 flex-1',
                editor.panelHidden ? 'max-w-2xl lg:max-w-4xl' : 'max-w-lg'
              )}
            >
              <CardapioEditorPreview
                restaurant={editor.previewRestaurant}
                products={editor.mergedProducts}
                selectedBlock={editor.selectedBlock}
                selectedField={editor.selectedField}
                selectedProductId={editor.selectedProductId}
                activeInlineTextField={editor.activeInlineTextField}
                activeInlineImageField={editor.activeInlineImageField}
                productDrafts={editor.productDrafts}
                inlineTextDrafts={editor.inlineTextDrafts}
                inlineImageDrafts={editor.inlineImageDrafts}
                productSaveState={editor.productSaveState}
                onSelectContext={editor.handleSelectContext}
                onInlineTextChange={editor.handleInlineTextChange}
                onInlineTextSave={editor.handleInlineTextSave}
                onInlineTextCancel={editor.handleInlineTextCancel}
                onInlineImageChange={editor.handleInlineImageChange}
                onInlineImageSave={editor.handleInlineImageSave}
                onInlineImageCancel={editor.handleInlineImageCancel}
                onInlineProductChange={editor.handleInlineProductChange}
                onInlineProductSave={editor.handleInlineProductSave}
                onInlineProductCancel={editor.handleInlineProductCancel}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
