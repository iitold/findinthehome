'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const DialogContext = createContext();

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);
  const resolveRef = useRef(null);

  const confirm = (message) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialogState({ type: 'confirm', message });
    });
  };

  const prompt = (message, defaultValue = '', title = null) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialogState({ type: 'prompt', message, defaultValue, title });
    });
  };

  const handleClose = (result) => {
    setDialogState(null);
    if (resolveRef.current) {
      resolveRef.current(result);
      resolveRef.current = null;
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {dialogState && (
        <DialogModal state={dialogState} onClose={handleClose} />
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

// Modal component
function DialogModal({ state, onClose }) {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(state.defaultValue || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (state.type === 'prompt' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state.type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (state.type === 'prompt') {
      onClose(inputValue.trim() ? inputValue.trim() : null);
    } else {
      onClose(true); // confirm -> true
    }
  };

  const handleCancel = () => {
    if (state.type === 'prompt') {
      onClose(null);
    } else {
      onClose(false); // confirm -> false
    }
  };

  const dialogTitle = state.title || (state.type === 'prompt' ? t('app.title') : t('app.title'));

  return (
    <div className="dialog-overlay" onClick={handleCancel}>
      <div className="dialog-content" onClick={e => e.stopPropagation()}>
        <h3 className="dialog-title">{dialogTitle}</h3>
        <p className="dialog-message">{state.message}</p>
        
        {state.type === 'prompt' && (
          <form onSubmit={handleSubmit} className="dialog-form">
            <input
              ref={inputRef}
              type="text"
              className="dialog-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="..."
            />
          </form>
        )}

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={handleCancel}>
            {t('entity.cancel')}
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {state.type === 'prompt' ? t('entity.save') : t('entity.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
