// Notification Events
// This file contains event handlers for notification events

export const notificationEvents = {
  notification_sent: (socket, data) => {
    // Handle notification_sent event
    console.log(`📡 notification_sent: `, data);
  },
  notification_read: (socket, data) => {
    // Handle notification_read event
    console.log(`📡 notification_read: `, data);
  },
  notification_cleared: (socket, data) => {
    // Handle notification_cleared event
    console.log(`📡 notification_cleared: `, data);
  }
};

export default notificationEvents;