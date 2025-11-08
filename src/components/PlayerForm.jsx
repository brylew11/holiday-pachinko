import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { playerFormSchema } from '../lib/validations/playerFormSchema'
import { createPlayer, updatePlayer, uploadPlayerImage, deletePlayerImage } from '../services/playerService'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'

export function PlayerForm({ mode = 'add', selectedPlayer = null, onCancel, onUpdateSuccess }) {
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState(null)
  const queryClient = useQueryClient()

  // Initialize form with react-hook-form and Zod validation
  const form = useForm({
    resolver: zodResolver(playerFormSchema),
    mode: 'onBlur',
    defaultValues: {
      playerName: '',
      playerImage: null,
    },
  })

  // Populate form when selectedPlayer changes (edit mode)
  useEffect(() => {
    if (mode === 'update' && selectedPlayer) {
      form.setValue('playerName', selectedPlayer.name)
      setImagePreview(selectedPlayer.originalPhotoUrl)
      setOriginalPhotoUrl(selectedPlayer.originalPhotoUrl)
      setSelectedFile(null)
    }
  }, [selectedPlayer, mode, form])

  // TanStack Query mutation for creating player
  const createMutation = useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
      toast.success('Player added successfully!')
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create player. Please try again.')
    },
  })

  // TanStack Query mutation for updating player
  const updateMutation = useMutation({
    mutationFn: async ({ playerId, name, imageFile }) => {
      let newPhotoUrl = originalPhotoUrl

      // If new image selected, upload it and delete old one
      if (imageFile) {
        newPhotoUrl = await uploadPlayerImage(imageFile)

        // Delete old image
        if (originalPhotoUrl) {
          try {
            await deletePlayerImage(originalPhotoUrl)
          } catch (error) {
            console.warn('Failed to delete old image:', error)
          }
        }
      }

      // Update player document
      return updatePlayer({
        playerId,
        name,
        originalPhotoUrl: newPhotoUrl
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
      toast.success('Player updated successfully!')
      if (onUpdateSuccess) {
        onUpdateSuccess()
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update player. Please try again.')
    },
  })

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files?.[0]

    if (file) {
      setSelectedFile(file)
      form.setValue('playerImage', file, { shouldValidate: true })

      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  // Handle remove image
  const handleRemoveImage = () => {
    setSelectedFile(null)

    // In edit mode, revert to original photo
    if (mode === 'update' && originalPhotoUrl) {
      setImagePreview(originalPhotoUrl)
      form.setValue('playerImage', null)
    } else {
      setImagePreview(null)
      form.setValue('playerImage', null)
    }

    // Reset file input
    const fileInput = document.getElementById('playerImage')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // Reset form to pristine state
  const resetForm = () => {
    form.reset()
    setSelectedFile(null)
    setImagePreview(null)
    setOriginalPhotoUrl(null)

    // Reset file input
    const fileInput = document.getElementById('playerImage')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // Handle cancel in edit mode
  const handleCancel = () => {
    resetForm()
    if (onCancel) {
      onCancel()
    }
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  // Form submit handler
  const onSubmit = async (data) => {
    if (mode === 'add') {
      createMutation.mutate({
        name: data.playerName,
        imageFile: selectedFile,
      })
    } else if (mode === 'update' && selectedPlayer) {
      updateMutation.mutate({
        playerId: selectedPlayer.id,
        name: data.playerName,
        imageFile: selectedFile,
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'add' ? 'Add New Player' : 'Update Player'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Player Name Field */}
            <FormField
              control={form.control}
              name="playerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter player name"
                      aria-describedby="playerName-error"
                      aria-invalid={!!form.formState.errors.playerName}
                    />
                  </FormControl>
                  <FormMessage id="playerName-error" />
                </FormItem>
              )}
            />

            {/* Player Image Field */}
            <FormField
              control={form.control}
              name="playerImage"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Player Image</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      id="playerImage"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      aria-describedby="playerImage-error"
                      aria-invalid={!!form.formState.errors.playerImage}
                    />
                  </FormControl>
                  <FormMessage id="playerImage-error" />
                </FormItem>
              )}
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="space-y-2 p-4 border rounded-md">
                <img
                  src={imagePreview}
                  alt={selectedFile ? `Preview of ${selectedFile.name}` : 'Player image'}
                  className="w-[200px] h-[200px] object-cover rounded-md mx-auto"
                />
                {selectedFile && (
                  <p className="text-sm text-center text-muted-foreground truncate">
                    {selectedFile.name}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveImage}
                  className="w-full"
                >
                  Remove
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {mode === 'update' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={isPending}
                >
                  Cancel
                </Button>
              )}

              <Button
                type="submit"
                className={mode === 'update' ? 'flex-1' : 'w-full'}
                disabled={isPending || !form.formState.isValid}
                aria-busy={isPending}
              >
                {isPending
                  ? mode === 'add' ? 'Adding Player...' : 'Updating Player...'
                  : mode === 'add' ? 'Add Player' : 'Update Player'
                }
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
