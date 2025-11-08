import { Toaster } from './components/ui/sonner'
import { PlayerForm } from './components/PlayerForm'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="container mx-auto">
        <PlayerForm />
      </div>
      <Toaster />
    </div>
  )
}

export default App
