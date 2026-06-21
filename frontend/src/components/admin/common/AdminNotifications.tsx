import { AlertTriangle, ChevronRight, Clock, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { NotificationRow } from '../../shared';
import { localizedData } from '../../../lib/rental-utils';
import type { Notification, TFunction, Tone } from '../../../types/domain';

type NotificationGroupTone = 'danger' | 'warning' | 'info';

type AdminNotificationListProps = {
  notifications: Notification[];
  t: TFunction;
  onSelect?: () => void;
  renderAction?: (notification: Notification) => ReactNode;
  itemClassName?: string;
};

const notificationToneOrder: NotificationGroupTone[] = ['danger', 'warning', 'info'];

export function AdminNotificationList({
  notifications,
  t,
  onSelect,
  renderAction,
  itemClassName = 'notification-popover-item',
}: AdminNotificationListProps) {
  const groups = notificationToneOrder
    .map((tone) => ({
      tone,
      items: notifications.filter((notification) => notificationGroupTone(notification.tone) === tone),
    }))
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) {
    return <p className="notification-empty">{t('admin.notifications.empty')}</p>;
  }

  return (
    <div className="notification-list-groups">
      {groups.map((group) => {
        const groupLabel = t(`admin.notifications.tone.${group.tone}`);
        return (
          <div className={`notification-severity-group ${group.tone}`} role="group" aria-label={groupLabel} key={group.tone}>
            <div className="notification-severity-group-head">
              <strong>{groupLabel}</strong>
              <span>{t('admin.notifications.unresolvedCount', { count: group.items.length })}</span>
            </div>
            {group.items.map((notification) => (
              <AdminNotificationItem
                notification={notification}
                t={t}
                onSelect={onSelect}
                renderAction={renderAction}
                itemClassName={itemClassName}
                key={notification.id}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function AdminNotificationItem({
  notification,
  t,
  onSelect,
  renderAction,
  itemClassName,
}: {
  notification: Notification;
  t: TFunction;
  onSelect?: () => void;
  renderAction?: (notification: Notification) => ReactNode;
  itemClassName: string;
}) {
  const title = localizedData(notification, 'title', t);
  const copy = localizedData(notification, 'copy', t);
  const Icon = notificationToneIcon(notification.tone);
  const rowProps = {
    className: itemClassName,
    tone: notification.tone,
    resolved: notification.resolved,
    severityLabel: t(`admin.notifications.tone.${notificationGroupTone(notification.tone)}`),
    severityIcon: Icon,
    title,
    copy,
  };

  if (renderAction) {
    return <NotificationRow {...rowProps}>{renderAction(notification)}</NotificationRow>;
  }

  return (
    <NotificationRow
      {...rowProps}
      as={Link}
      to={notificationTarget(notification)}
      aria-label={t('admin.notifications.contextAria', { title })}
      onClick={onSelect}
    >
      <span className="notification-context">
        {t('admin.notifications.context')}
        <ChevronRight aria-hidden="true" />
      </span>
    </NotificationRow>
  );
}

export function notificationToneIcon(tone: Tone): LucideIcon {
  if (tone === 'danger') return AlertTriangle;
  if (tone === 'warning') return Clock;
  return Info;
}

export function notificationTarget(notification: Notification): string {
  if (notification.targetRoute) return notification.targetRoute;
  const text = `${notification.titleId ?? ''} ${notification.copyId ?? ''} ${notification.titleEn ?? ''} ${notification.copyEn ?? ''}`;
  const reference = text.match(/CR-\d+/i)?.[0];
  if (reference) return `/admin/rentals/${encodeURIComponent(reference.toUpperCase())}`;
  if (notification.tone === 'warning') return '/admin/requests';
  return '/admin/rentals';
}

function notificationGroupTone(tone: Tone): NotificationGroupTone {
  if (tone === 'danger' || tone === 'warning') return tone;
  return 'info';
}
