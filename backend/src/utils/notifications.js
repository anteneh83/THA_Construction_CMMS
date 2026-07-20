const Notification = require('../models/Notification');

/**
 * Create and save a notification
 * @param {Object} params
 * @param {string} params.recipientId - User ID of recipient
 * @param {string} params.type - Notification type enum
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification body
 * @param {Object} [params.relatedEntity] - { entityType, entityId }
 */
const createNotification = async ({ recipientId, type, title, message, relatedEntity }) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      relatedEntity: relatedEntity || {}
    });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

/**
 * Create notifications for multiple recipients
 */
const createBulkNotifications = async (recipientIds, { type, title, message, relatedEntity }) => {
  try {
    const notifications = recipientIds.map(recipientId => ({
      recipient: recipientId,
      type,
      title,
      message,
      relatedEntity: relatedEntity || {}
    }));
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Failed to create bulk notifications:', error.message);
  }
};

module.exports = { createNotification, createBulkNotifications };
