const { Sequelize } = require('sequelize');
const config = require('../config');

const sequelize = new Sequelize(config.DB.NAME, config.DB.USER, config.DB.PASSWORD, {
    host: config.DB.HOST,
    port: config.DB.PORT,
    dialect: 'mysql',
    logging: false
});

const QuickBooksToken = require('../../modules/quickbooks/model')(sequelize);
const XeroToken       = require('../../modules/xero/model')(sequelize);

// Unified users table used by the auth module
const User = require('../../modules/auth/user.model')(sequelize);

// Backward-compatible alias — the legacy admin module still imports
// { Admin } from here. Pointing it to User means the admins table and
// users table share the same model during the transition period.
// Once admin/repository.js and admin/service.js are removed, this alias
// can be deleted.
const Admin = require('../../modules/admin/model')(sequelize);

const Notification = require('../../modules/notifications/notification.model')(sequelize);

// Associations
User.hasMany(QuickBooksToken, { foreignKey: 'user_id', as: 'quickbooksTokens' });
QuickBooksToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(XeroToken, { foreignKey: 'user_id', as: 'xeroTokens' });
XeroToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
    sequelize,
    QuickBooksToken,
    XeroToken,
    User,
    Admin,  // legacy alias — will be removed after admin module is retired
    Notification
};
