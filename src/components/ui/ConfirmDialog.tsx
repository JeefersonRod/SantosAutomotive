import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
      footer={(
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      )}
    >
      <div />
    </Modal>
  );
}
