import { getNotificationSettingsByUserId } from "../repositories/NotificationSettingsRepository.js";
import pool from "../config/database.js";
import {
  createEmailTransporter,
  getEmailFromAddress,
} from "./emailTransport.js";
import { getFrontendBaseUrl } from "./appUrls.js";

const transporter = createEmailTransporter();
const emailFrom = () => `"Startup Connect" <${getEmailFromAddress()}>`;

/**
 * Notification types enum
 */
export const NotificationType = {
  CONNECTION_REQUEST: 'connection_request',
  MESSAGE: 'message',
  PROFILE_VIEW: 'profile_view',
  SYSTEM_UPDATE: 'system_update',
};

/**
 * Check if user should receive email notification based on their preferences
 * @param {string} userId - User ID
 * @param {string} notificationType - Type of notification (from NotificationType enum)
 * @returns {Promise<boolean>} True if email should be sent
 */
export async function shouldSendEmailNotification(userId, notificationType) {
  try {
    const settings = await getNotificationSettingsByUserId(userId);
    
    // If no settings found, use default behavior (send emails)
    if (!settings) {
      return true;
    }

    // Check specific notification type preference
    switch (notificationType) {
      case NotificationType.CONNECTION_REQUEST:
        return settings.email_connection_requests === true;
      case NotificationType.MESSAGE:
        return settings.email_messages === true;
      case NotificationType.PROFILE_VIEW:
        return settings.email_profile_views === true;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking email notification preference:', error);
    // Default to sending notification if there's an error
    return true;
  }
}

/**
 * Check if user should receive in-app notification based on their preferences
 * @param {string} userId - User ID
 * @param {string} notificationType - Type of notification (from NotificationType enum)
 * @returns {Promise<boolean>} True if in-app notification should be shown
 */
export async function shouldSendInAppNotification(userId, notificationType) {
  try {
    const settings = await getNotificationSettingsByUserId(userId);
    
    // If no settings found, use default behavior (show in-app notifications)
    if (!settings) {
      return true;
    }

    // Check specific notification type preference
    switch (notificationType) {
      case NotificationType.CONNECTION_REQUEST:
        return settings.inapp_connection_requests === true;
      case NotificationType.MESSAGE:
        return settings.inapp_messages === true;
      case NotificationType.PROFILE_VIEW:
        return settings.inapp_profile_views === true;
      case NotificationType.SYSTEM_UPDATE:
        return settings.inapp_system_updates === true;
      default:
        return true;
    }
  } catch (error) {
    console.error('Error checking in-app notification preference:', error);
    // Default to showing notification if there's an error
    return true;
  }
}

/**
 * Get user's notification frequency preference
 * @param {string} userId - User ID
 * @returns {Promise<string>} Notification frequency ('instant', 'daily', or 'weekly')
 */
export async function getNotificationFrequency(userId) {
  try {
    const settings = await getNotificationSettingsByUserId(userId);
    return settings?.notification_frequency || 'instant';
  } catch (error) {
    console.error('Error getting notification frequency:', error);
    return 'instant';
  }
}

/**
 * Queue a notification for delivery (either instant or batched)
 * @param {string} userId - User ID
 * @param {string} notificationType - Type of notification
 * @param {Object} notificationData - Notification content data
 */
export async function queueNotification(userId, notificationType, notificationData) {
  try {
    const frequency = await getNotificationFrequency(userId);
    
    if (frequency === 'instant') {
      // Send notification immediately
      await deliverInstantNotification(userId, notificationType, notificationData);
    } else {
      // Store for batched delivery (daily or weekly)
      await storeNotificationForBatch(userId, notificationType, notificationData, frequency);
    }
  } catch (error) {
    console.error('Error queueing notification:', error);
  }
}

/**
 * Deliver instant notification to user
 * @param {string} userId - User ID
 * @param {string} notificationType - Type of notification
 * @param {Object} notificationData - Notification content data
 */
async function deliverInstantNotification(userId, notificationType, notificationData) {
  try {
    // Check if email should be sent
    const shouldEmail = await shouldSendEmailNotification(userId, notificationType);
    
    if (shouldEmail) {
      await sendNotificationEmail(userId, notificationType, notificationData);
    }

    // In-app notifications would be handled via WebSocket/Socket.IO
    const shouldInApp = await shouldSendInAppNotification(userId, notificationType);
    
    if (shouldInApp) {
      // In-app notifications use polling until a Realtime channel is added.
      console.log(`In-app notification would be sent to user ${userId}`);
    }
  } catch (error) {
    console.error('Error delivering instant notification:', error);
  }
}

/**
 * Store notification for batched delivery (daily/weekly digest)
 * @param {string} userId - User ID
 * @param {string} notificationType - Type of notification
 * @param {Object} notificationData - Notification content data
 * @param {string} frequency - Notification frequency ('daily' or 'weekly')
 */
async function storeNotificationForBatch(userId, notificationType, notificationData, frequency) {
  try {
    // Store notification in a pending_notifications table for batch processing
    // This table would need to be created in a future migration
    const query = `
      INSERT INTO pending_notifications (
        user_id, 
        notification_type, 
        notification_data, 
        batch_frequency,
        created_at
      ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    `;
    
    await pool.query(query, [
      userId,
      notificationType,
      JSON.stringify(notificationData),
      frequency
    ]);
    
    console.log(`Notification queued for ${frequency} batch delivery to user ${userId}`);
  } catch (error) {
    // If table doesn't exist yet, fall back to instant delivery
    if (error.code === '42P01') { // PostgreSQL error code for undefined table
      console.log('Pending notifications table not found, sending instant notification');
      await deliverInstantNotification(userId, notificationType, notificationData);
    } else {
      console.error('Error storing notification for batch:', error);
    }
  }
}

/**
 * Send notification email based on type
 * @param {string} userId - User ID
 * @param {string} notificationType - Type of notification
 * @param {Object} data - Notification data
 */
async function sendNotificationEmail(userId, notificationType, data) {
  try {
    // Get user email
    const userQuery = await pool.query('SELECT email, full_name FROM users WHERE id = $1', [userId]);
    
    if (userQuery.rows.length === 0) {
      console.error(`User ${userId} not found`);
      return false;
    }
    
    const { email, full_name } = userQuery.rows[0];
    
    let mailOptions;
    
    switch (notificationType) {
      case NotificationType.CONNECTION_REQUEST:
        mailOptions = {
          from: emailFrom(),
          to: email,
          subject: 'New Connection Request',
          html: `
            <h2>Hello ${full_name}!</h2>
            <p>You have a new connection request from <strong>${data.senderName}</strong>.</p>
            <p>Log in to your account to view and respond to this request.</p>
            <p><a href="${getFrontendBaseUrl()}/connections">View Connection Request</a></p>
          `,
        };
        break;
        
      case NotificationType.MESSAGE:
        mailOptions = {
          from: emailFrom(),
          to: email,
          subject: 'New Message',
          html: `
            <h2>Hello ${full_name}!</h2>
            <p>You have a new message from <strong>${data.senderName}</strong>.</p>
            <p>Log in to your account to read and reply to this message.</p>
            <p><a href="${getFrontendBaseUrl()}/messages">View Messages</a></p>
          `,
        };
        break;
        
      case NotificationType.PROFILE_VIEW:
        mailOptions = {
          from: emailFrom(),
          to: email,
          subject: 'Someone Viewed Your Profile',
          html: `
            <h2>Hello ${full_name}!</h2>
            <p><strong>${data.viewerName}</strong> viewed your profile.</p>
            <p>Log in to your account to see who's interested in connecting with you.</p>
            <p><a href="${getFrontendBaseUrl()}/profile">View Your Profile</a></p>
          `,
        };
        break;
        
      default:
        console.log(`Unknown notification type: ${notificationType}`);
        return false;
    }
    
    await transporter.sendMail(mailOptions);
    console.log(`Notification email sent to ${email}`);
    return true;
    
  } catch (error) {
    console.error('Error sending notification email:', error);
    return false;
  }
}

/**
 * Process daily digest for all users who have daily frequency enabled
 * This function should be called by a cron job once per day
 */
export async function processDailyDigest() {
  try {
    // Get all users with daily notification frequency who have pending notifications
    const query = `
      SELECT DISTINCT u.id, u.email, u.full_name
      FROM users u
      INNER JOIN notification_settings ns ON u.id = ns.user_id
      INNER JOIN pending_notifications pn ON u.id = pn.user_id
      WHERE ns.notification_frequency = 'daily'
      AND pn.batch_frequency = 'daily'
      AND pn.sent_at IS NULL
    `;
    
    const result = await pool.query(query);
    
    for (const user of result.rows) {
      await sendBatchedDigest(user.id, user.email, user.full_name, 'daily');
    }
    
    console.log(`Processed daily digest for ${result.rows.length} users`);
  } catch (error) {
    if (error.code === '42P01') {
      console.log('Pending notifications table not found, skipping digest processing');
    } else {
      console.error('Error processing daily digest:', error);
    }
  }
}

/**
 * Process weekly digest for all users who have weekly frequency enabled
 * This function should be called by a cron job once per week
 */
export async function processWeeklyDigest() {
  try {
    // Get all users with weekly notification frequency who have pending notifications
    const query = `
      SELECT DISTINCT u.id, u.email, u.full_name
      FROM users u
      INNER JOIN notification_settings ns ON u.id = ns.user_id
      INNER JOIN pending_notifications pn ON u.id = pn.user_id
      WHERE ns.notification_frequency = 'weekly'
      AND pn.batch_frequency = 'weekly'
      AND pn.sent_at IS NULL
    `;
    
    const result = await pool.query(query);
    
    for (const user of result.rows) {
      await sendBatchedDigest(user.id, user.email, user.full_name, 'weekly');
    }
    
    console.log(`Processed weekly digest for ${result.rows.length} users`);
  } catch (error) {
    if (error.code === '42P01') {
      console.log('Pending notifications table not found, skipping digest processing');
    } else {
      console.error('Error processing weekly digest:', error);
    }
  }
}

/**
 * Send batched digest email to user
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} fullName - User full name
 * @param {string} frequency - Batch frequency ('daily' or 'weekly')
 */
async function sendBatchedDigest(userId, email, fullName, frequency) {
  try {
    // Get all pending notifications for this user
    const notificationsQuery = `
      SELECT notification_type, notification_data, created_at
      FROM pending_notifications
      WHERE user_id = $1 
      AND batch_frequency = $2
      AND sent_at IS NULL
      ORDER BY created_at DESC
    `;
    
    const notifications = await pool.query(notificationsQuery, [userId, frequency]);
    
    if (notifications.rows.length === 0) {
      return;
    }
    
    // Group notifications by type
    const grouped = {};
    notifications.rows.forEach(notif => {
      if (!grouped[notif.notification_type]) {
        grouped[notif.notification_type] = [];
      }
      grouped[notif.notification_type].push(JSON.parse(notif.notification_data));
    });
    
    // Build digest email HTML
    let digestHtml = `
      <h2>Hello ${fullName}!</h2>
      <p>Here's your ${frequency} digest of notifications:</p>
    `;
    
    if (grouped[NotificationType.CONNECTION_REQUEST]) {
      digestHtml += `
        <h3>Connection Requests (${grouped[NotificationType.CONNECTION_REQUEST].length})</h3>
        <ul>
          ${grouped[NotificationType.CONNECTION_REQUEST].map(req => 
            `<li>${req.senderName} sent you a connection request</li>`
          ).join('')}
        </ul>
      `;
    }
    
    if (grouped[NotificationType.MESSAGE]) {
      digestHtml += `
        <h3>New Messages (${grouped[NotificationType.MESSAGE].length})</h3>
        <ul>
          ${grouped[NotificationType.MESSAGE].map(msg => 
            `<li>New message from ${msg.senderName}</li>`
          ).join('')}
        </ul>
      `;
    }
    
    if (grouped[NotificationType.PROFILE_VIEW]) {
      digestHtml += `
        <h3>Profile Views (${grouped[NotificationType.PROFILE_VIEW].length})</h3>
        <ul>
          ${grouped[NotificationType.PROFILE_VIEW].map(view => 
            `<li>${view.viewerName} viewed your profile</li>`
          ).join('')}
        </ul>
      `;
    }
    
    digestHtml += `
      <p><a href="${getFrontendBaseUrl()}/dashboard">Visit Your Dashboard</a></p>
    `;
    
    const mailOptions = {
      from: emailFrom(),
      to: email,
      subject: `Your ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Digest`,
      html: digestHtml,
    };
    
    await transporter.sendMail(mailOptions);
    
    // Mark notifications as sent
    await pool.query(
      'UPDATE pending_notifications SET sent_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND batch_frequency = $2 AND sent_at IS NULL',
      [userId, frequency]
    );
    
    console.log(`${frequency} digest sent to ${email}`);
    
  } catch (error) {
    console.error(`Error sending ${frequency} digest:`, error);
  }
}

/**
 * Helper function to send connection request notification
 * @param {string} userId - Recipient user ID
 * @param {string} senderName - Name of the person sending connection request
 */
export async function notifyConnectionRequest(userId, senderName) {
  await queueNotification(userId, NotificationType.CONNECTION_REQUEST, { senderName });
}

/**
 * Helper function to send new message notification
 * @param {string} userId - Recipient user ID
 * @param {string} senderName - Name of the person sending message
 */
export async function notifyNewMessage(userId, senderName) {
  await queueNotification(userId, NotificationType.MESSAGE, { senderName });
}

/**
 * Helper function to send profile view notification
 * @param {string} userId - Profile owner user ID
 * @param {string} viewerName - Name of the person viewing profile
 */
export async function notifyProfileView(userId, viewerName) {
  await queueNotification(userId, NotificationType.PROFILE_VIEW, { viewerName });
}
