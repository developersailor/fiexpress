// Message Events
// This file contains event handlers for message events

export const messageEvents = {
  message_sent: (socket, data) => {
    // Handle message_sent event
    console.log(`📡 message_sent: `, data);
  },
  message_received: (socket, data) => {
    // Handle message_received event
    console.log(`📡 message_received: `, data);
  },
  message_delivered: (socket, data) => {
    // Handle message_delivered event
    console.log(`📡 message_delivered: `, data);
  },
  message_read: (socket, data) => {
    // Handle message_read event
    console.log(`📡 message_read: `, data);
  }
};

export default messageEvents;