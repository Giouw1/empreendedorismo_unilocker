import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { IS_EMBEDDED, ViewModeShell } from './components/ViewModeShell';
import './index.css';

// Dentro da moldura de celular, esconde barras de rolagem como em um aparelho real.
if (IS_EMBEDDED) document.documentElement.classList.add('embedded');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ViewModeShell>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ViewModeShell>
  </React.StrictMode>,
);
