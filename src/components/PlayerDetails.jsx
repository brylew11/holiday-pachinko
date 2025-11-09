import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { regenerateAvatar } from '../services/avatarService'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { RefreshCw } from 'lucide-react'

export function PlayerDetails({ player }) {
  const queryClient = useQueryClient()

  // Regenerate avatar mutation
  const regenerateMutation = useMutation({
    mutationFn: regenerateAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
      toast.success('Avatar regenerated successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to regenerate avatar. Please try again.')
    },
  })

  const handleRegenerateAvatar = () => {
    if (player?.id && player?.originalPhotoUrl) {
      regenerateMutation.mutate({
        playerId: player.id,
        originalPhotoUrl: player.originalPhotoUrl
      })
    }
  }

  if (!player) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-8 text-center text-muted-foreground">
          Select a player to view details
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Player Details: {player.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Display Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Original Photo */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Original Photo</h3>
            <div className="border rounded-lg p-4 flex items-center justify-center bg-muted/20">
              <img
                src={player.originalPhotoUrl}
                alt={`Original photo of ${player.name}`}
                className="w-[200px] h-[200px] object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Generated Avatar */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Generated Avatar</h3>
            <div className="border rounded-lg p-4 flex items-center justify-center bg-muted/20 relative">
              <img
                src={player.avatarUrl || player.originalPhotoUrl}
                alt={`Generated avatar of ${player.name}`}
                className="w-[200px] h-[200px] object-cover rounded-lg"
              />

              {/* Generation Status Badges */}
              {player.generationStatus === 'pending' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <span className="text-sm font-medium">Generating...</span>
                  </div>
                </div>
              )}

              {player.generationStatus === 'failed' && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs rounded">
                    Failed
                  </span>
                </div>
              )}

              {player.generationStatus === 'completed' && player.avatarUrl && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">
                    Generated
                  </span>
                </div>
              )}
            </div>

            {/* Regenerate Button */}
            <Button
              variant="outline"
              onClick={handleRegenerateAvatar}
              disabled={regenerateMutation.isPending || player.generationStatus === 'pending'}
              className="w-full"
              aria-busy={regenerateMutation.isPending}
            >
              {regenerateMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerate Avatar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Player Information */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Status:</span>
            <span className="font-medium capitalize">{player.status || 'active'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Avatar Generation:</span>
            <span className="font-medium capitalize">{player.generationStatus || 'pending'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
