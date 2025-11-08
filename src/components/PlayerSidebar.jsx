import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { fetchPlayers, deactivatePlayer, deletePlayer } from '../services/playerService'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog'
import { Trash2, Ban } from 'lucide-react'

export function PlayerSidebar({ selectedPlayerId, onSelectPlayer, onPlayerDeleted }) {
  const queryClient = useQueryClient()
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [playerToAction, setPlayerToAction] = useState(null)

  // Fetch players using TanStack Query
  const { data: players = [], isLoading, isError } = useQuery({
    queryKey: ['players'],
    queryFn: fetchPlayers,
  })

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: deactivatePlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
      toast.success('Player deactivated successfully')
      setDeactivateDialogOpen(false)
      setPlayerToAction(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to deactivate player')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deletePlayer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['players'] })
      toast.success('Player deleted successfully')
      setDeleteDialogOpen(false)

      // If deleted player was selected, clear form
      if (onPlayerDeleted && data.id === selectedPlayerId) {
        onPlayerDeleted()
      }

      setPlayerToAction(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete player')
    },
  })

  const handleDeactivateClick = (player, e) => {
    e.stopPropagation()
    setPlayerToAction(player)
    setDeactivateDialogOpen(true)
  }

  const handleDeleteClick = (player, e) => {
    e.stopPropagation()
    setPlayerToAction(player)
    setDeleteDialogOpen(true)
  }

  const confirmDeactivate = () => {
    if (playerToAction) {
      deactivateMutation.mutate(playerToAction.id)
    }
  }

  const confirmDelete = () => {
    if (playerToAction) {
      deleteMutation.mutate({
        playerId: playerToAction.id,
        imageUrl: playerToAction.originalPhotoUrl,
      })
    }
  }

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Players</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading State */}
          {isLoading && (
            <div className="text-center text-muted-foreground py-8">
              Loading players...
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center text-destructive py-8">
              Failed to load players. Please try again.
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && players.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No players yet. Add your first player using the form.
            </div>
          )}

          {/* Players List */}
          {!isLoading && !isError && players.length > 0 && (
            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className={`
                    flex items-center gap-3 p-3 rounded-md cursor-pointer
                    transition-colors hover:bg-accent
                    ${selectedPlayerId === player.id ? 'border-2 border-primary bg-accent' : 'border border-transparent'}
                    ${player.status === 'inactive' ? 'opacity-50' : ''}
                  `}
                >
                  {/* Player Avatar */}
                  <img
                    src={player.originalPhotoUrl}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{player.name}</p>
                    {player.status === 'inactive' && (
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    {/* Deactivate Button */}
                    {player.status !== 'inactive' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeactivateClick(player, e)}
                        disabled={deactivateMutation.isPending}
                        aria-label={`Deactivate ${player.name}`}
                        className="h-8 w-8"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteClick(player, e)}
                      disabled={deleteMutation.isPending}
                      aria-label={`Delete ${player.name}`}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Player</AlertDialogTitle>
            <AlertDialogDescription>
              Deactivate {playerToAction?.name}? They will remain in the database but won't be added to future games.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeactivate}>
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Player</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete {playerToAction?.name}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
