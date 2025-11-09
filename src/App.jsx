import { useState } from 'react'
import { Toaster } from './components/ui/sonner'
import { PlayerForm } from './components/PlayerForm'
import { PlayerSidebar } from './components/PlayerSidebar'
import { PlayerDetails } from './components/PlayerDetails'
import { GameConfiguration } from './components/GameConfiguration'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import './App.css'

function App() {
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [formMode, setFormMode] = useState('add')

  // Handle player selection from sidebar
  const handleSelectPlayer = (player) => {
    setSelectedPlayer(player)
    setFormMode('update')
  }

  // Handle cancel edit mode
  const handleCancelEdit = () => {
    setSelectedPlayer(null)
    setFormMode('add')
  }

  // Handle successful update
  const handleUpdateSuccess = () => {
    // Keep form in edit mode with current player
    // User can continue editing or cancel manually
  }

  // Handle player deletion when selected player is deleted
  const handlePlayerDeleted = () => {
    setSelectedPlayer(null)
    setFormMode('add')
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8">Holiday Pachinko Admin Panel</h1>

        <Tabs defaultValue="players" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Player Form */}
              <div className="space-y-8">
                <PlayerForm
                  mode={formMode}
                  selectedPlayer={selectedPlayer}
                  onCancel={handleCancelEdit}
                  onUpdateSuccess={handleUpdateSuccess}
                />

                {/* Player Details (shown when player is selected) */}
                {selectedPlayer && (
                  <PlayerDetails player={selectedPlayer} />
                )}
              </div>

              {/* Right Column: Player Sidebar */}
              <div>
                <PlayerSidebar
                  selectedPlayerId={selectedPlayer?.id}
                  onSelectPlayer={handleSelectPlayer}
                  onPlayerDeleted={handlePlayerDeleted}
                />
              </div>
            </div>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="configuration">
            <GameConfiguration />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}

export default App
