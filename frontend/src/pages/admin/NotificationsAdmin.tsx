import { Check } from 'lucide-react';
import { AdminNotificationList } from '../../components/admin/common/AdminNotifications';
import { StatusPill } from '../../components/shared';
import type { StateSetter } from '../../types/app';
import type { Notification, TFunction } from '../../types/domain';

type NotificationsAdminProps = {
  t: TFunction;
  notifications: Notification[];
  setNotifications: StateSetter<Notification[]>;
};

export default function NotificationsAdmin({ t, notifications, setNotifications }: NotificationsAdminProps) {
  const unresolved = notifications.filter((notification) => !notification.resolved);

  return (
    <section className="base-window notification-window">
      <div className="notification-window-head">
        <div>
          <span className="section-kicker">{t('admin.notifications.inboxKicker')}</span>
          <h2>{t('admin.notifications.inboxTitle')}</h2>
          <p>{t('admin.notifications.inboxCopy')}</p>
        </div>
        <strong>{t('admin.notifications.unresolvedCount', { count: unresolved.length })}</strong>
      </div>
      <div className="notification-list">
        <AdminNotificationList
          notifications={notifications}
          t={t}
          itemClassName="notification-item"
          renderAction={(notification) =>
            notification.resolved ? (
              <StatusPill value={t('admin.notifications.resolved')} t={t} tone="success" icon={Check} />
            ) : (
              <button className="outline-button" type="button" onClick={() => setNotifications((current) => current.map((item) => (item.id === notification.id ? { ...item, resolved: true } : item)))}>
                {t('admin.notifications.resolve')}
              </button>
            )
          }
        />
      </div>
    </section>
  );
}
