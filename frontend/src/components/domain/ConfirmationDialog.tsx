import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  requireCheckboxLabel?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  requireCheckboxLabel,
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsChecked(false);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireCheckboxLabel && !isChecked) return;
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'btn-error';
      case 'warning':
        return 'btn-warning';
      case 'primary':
        return 'btn-primary';
    }
  };

  return (
    <div className="modal modal-open">
      <div
        className="modal-box max-w-md space-y-4"
        role="dialog"
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-field flex items-center justify-center shrink-0 ${
              variant === 'danger'
                ? 'bg-error/10 text-error'
                : variant === 'warning'
                ? 'bg-warning/15 text-warning'
                : 'bg-primary/10 text-primary'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold leading-tight">{title}</h3>
            <p className="text-sm text-base-content/60 mt-1">{description}</p>
          </div>
        </div>

        {requireCheckboxLabel && (
          <div className="bg-base-200 rounded-box p-3.5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="checkbox checkbox-sm checkbox-primary mt-0.5"
              />
              <span className="text-sm leading-snug">
                {requireCheckboxLabel}
              </span>
            </label>
          </div>
        )}

        <div className="modal-action mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn btn-ghost"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading || (!!requireCheckboxLabel && !isChecked)}
            className={`btn ${getButtonStyles()}`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
