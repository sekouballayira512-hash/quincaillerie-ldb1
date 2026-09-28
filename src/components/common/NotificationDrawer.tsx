import React from 'react';
import { AppNotification } from '../../types';
import { X, Bell, CheckCircle2, Clock, CheckCheck, ExternalLink } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onNavigate: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base">Notifications</h2>
              <p className="text-xs text-slate-500">Mises à jour devis & commandes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-slate-50/70 border-b border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">{notifications.length} message(s)</span>
            <button
              onClick={onMarkAllAsRead}
              className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Tout marquer comme lu
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-300" />
              </div>
              <p className="font-medium text-slate-600">Aucune notification</p>
              <p className="text-xs text-slate-400 mt-1">
                Vous recevrez ici les confirmations de devis et paiements.
              </p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  if (!notif.read) onMarkAsRead(notif.id);
                  if (notif.link?.includes('devis')) onNavigate('devis');
                  else if (notif.link?.includes('commande')) onNavigate('commandes');
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-white border-slate-100 text-slate-600'
                    : 'bg-emerald-50/40 border-emerald-200 text-slate-900 shadow-2xs'
                } hover:border-emerald-300`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    )}
                    {notif.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(notif.createdAt, true)}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {notif.message}
                </p>
                {notif.link && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                    <span>Consulter le détail</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
