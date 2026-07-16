function toNotificationDTO(notification) {
  if (!notification) return null;
  return {
    id: notification._id || notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    read: notification.read || false,
    source: notification.source,
    metadata: notification.metadata || {},
    createdAt: notification.createdAt
  };
}

module.exports = { toNotificationDTO };
