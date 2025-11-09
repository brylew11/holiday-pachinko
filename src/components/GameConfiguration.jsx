import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchAvatarSettings, updateAvatarPrompt } from '../services/avatarService'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

export function GameConfiguration() {
  const [promptText, setPromptText] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const queryClient = useQueryClient()

  // Fetch avatar settings using TanStack Query
  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['avatarSettings'],
    queryFn: fetchAvatarSettings,
  })

  // Update prompt mutation
  const updateMutation = useMutation({
    mutationFn: updateAvatarPrompt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avatarSettings'] })
      toast.success('AI avatar prompt updated successfully')
      setIsDirty(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update prompt. Please try again.')
    },
  })

  // Initialize prompt text when settings load
  useEffect(() => {
    if (settings?.geminiAvatarPrompt) {
      setPromptText(settings.geminiAvatarPrompt)
      setIsDirty(false)
    }
  }, [settings])

  // Handle prompt text change
  const handlePromptChange = (e) => {
    setPromptText(e.target.value)
    setIsDirty(e.target.value !== settings?.geminiAvatarPrompt)
  }

  // Handle save button click
  const handleSave = () => {
    updateMutation.mutate({ geminiAvatarPrompt: promptText })
  }

  // Calculate character count
  const charCount = promptText.length
  const isRecommendedLength = charCount >= 100 && charCount <= 500

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Game Configuration</h1>

      {/* AI Avatar Settings Section */}
      <Card>
        <CardHeader>
          <CardTitle>AI Avatar Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure the AI prompt used to generate player avatars from uploaded photos.
          </p>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-4 text-muted-foreground">
              Loading settings...
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center py-4 text-destructive">
              Failed to load settings. Please try again.
            </div>
          )}

          {/* Prompt Textarea */}
          {!isLoading && !isError && (
            <>
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium">
                  Gemini Avatar Prompt
                </label>
                <Textarea
                  id="prompt"
                  rows={4}
                  value={promptText}
                  onChange={handlePromptChange}
                  placeholder="Enter the AI prompt for avatar generation..."
                  className="w-full"
                  aria-describedby="prompt-help"
                />

                {/* Character Count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {charCount} characters
                  </span>
                  <span
                    className={`${
                      isRecommendedLength
                        ? 'text-muted-foreground'
                        : 'text-amber-600'
                    }`}
                  >
                    Recommended: 100-500 characters
                  </span>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={!isDirty || updateMutation.isPending}
                  aria-busy={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Prompt'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
