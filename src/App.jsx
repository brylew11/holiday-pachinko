import { useState } from 'react'
import { Toaster } from './components/ui/sonner'
import { PlayerForm } from './components/PlayerForm'
import { PlayerSidebar } from './components/PlayerSidebar'
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Player Form */}
          <div>
            <PlayerForm
              mode={formMode}
              selectedPlayer={selectedPlayer}
              onCancel={handleCancelEdit}
              onUpdateSuccess={handleUpdateSuccess}
            />
          </div>

          {/* Player Sidebar */}
          <div>
            <PlayerSidebar
              selectedPlayerId={selectedPlayer?.id}
              onSelectPlayer={handleSelectPlayer}
              onPlayerDeleted={handlePlayerDeleted}
            />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
}

export default App
