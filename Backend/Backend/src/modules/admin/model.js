const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define(
        "Admin",
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },

            name: {
                type: DataTypes.STRING(100),
                allowNull: false
            },

            email: {
                type: DataTypes.STRING(150),
                allowNull: false,
                unique: true
            },

            password: {
                type: DataTypes.STRING,
                allowNull: false
            }
        },
        {
            tableName: "admins",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at"
        }
    );
};