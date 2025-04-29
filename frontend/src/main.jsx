import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
// import './index.css'
import './styles/themes.css'
import './styles/animations.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

// Add theme transition class to body
document.body.classList.add('theme-transition');

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)
