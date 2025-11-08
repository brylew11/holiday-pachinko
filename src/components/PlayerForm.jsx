import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { playerFormSchema } from '../lib/validations/playerFormSchema'
import { createPlayer } from '../services/playerService'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'

export function PlayerForm() {
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  // Initialize form with react-hook-form and Zod validation
  const form = useForm({
    resolver: zodResolver(playerFormSchema),
    mode: 'onBlur',
    defaultValues: {
      playerName: '',
      playerImage: null,
    },
  })

  // TanStack Query mutation for form submission
  const mutation = useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      toast.success('Player added successfully!')
      resetForm()
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create player. Please try again.')
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
    setImagePreview(null)
    form.setValue('playerImage', null)

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

    // Reset file input
    const fileInput = document.getElementById('playerImage')
    if (fileInput) {
      fileInput.value = ''
    }
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  // Form submit handler
  const onSubmit = async (data) => {
    mutation.mutate({
      name: data.playerName,
      imageFile: selectedFile,
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Add New Player</CardTitle>
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
            {imagePreview && selectedFile && (
              <div className="space-y-2 p-4 border rounded-md">
                <img
                  src={imagePreview}
                  alt={`Preview of ${selectedFile.name}`}
                  className="w-[200px] h-[200px] object-cover rounded-md mx-auto"
                />
                <p className="text-sm text-center text-muted-foreground truncate">
                  {selectedFile.name}
                </p>
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

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending || !form.formState.isValid}
              aria-busy={mutation.isPending}
            >
              {mutation.isPending ? 'Adding Player...' : 'Add Player'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
