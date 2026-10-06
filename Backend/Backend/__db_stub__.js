
module.exports = {
  sequelize: { define: () => ({}) },
  QuickBooksToken: { findAll: async () => [], count: async () => 0, update: async () => [0] },
  XeroToken: { findAll: async () => [], count: async () => 0, update: async () => [0] },
  User: { findOne: async () => null, findByPk: async () => null, findAll: async () => [], create: async () => ({}), update: async () => [0] },
  Admin: {}
};
