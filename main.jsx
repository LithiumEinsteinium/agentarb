import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { PhantomProvider, darkTheme } from '@phantom/react-sdk'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PhantomProvider 
      config={{ 
        providers: ["injected"], 
        addressTypes: ["ethereum"],
        appId: "2bca8d09-61a7-4723-ac15-78f26035ded0"
      }}
      theme={darkTheme}
    >
      <App />
    </PhantomProvider>
  </React.StrictMode>
)
