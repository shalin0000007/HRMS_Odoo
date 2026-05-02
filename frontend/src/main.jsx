// Import React strict mode for highlighting potential problems
import { StrictMode } from 'react'
// Import the React DOM client to render the app into the HTML
import { createRoot } from 'react-dom/client'

// Import global Tailwind CSS and custom animations
import './index.css'
// Import the root App component which holds our Router
import App from './App.jsx'

// Find the <div id="root"> in index.html and render the React app inside it
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
