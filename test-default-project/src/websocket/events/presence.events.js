// Presence Events
// This file contains event handlers for presence events

export const presenceEvents = {
  user_online: (socket, data) => {
    // Handle user_online event
    console.log(`📡 user_online: `, data);
  },
  user_offline: (socket, data) => {
    // Handle user_offline event
    console.log(`📡 user_offline: `, data);
  },
  user_away: (socket, data) => {
    // Handle user_away event
    console.log(`📡 user_away: `, data);
  },
  user_busy: (socket, data) => {
    // Handle user_busy event
    console.log(`📡 user_busy: `, data);
  }
};

export default presenceEvents;