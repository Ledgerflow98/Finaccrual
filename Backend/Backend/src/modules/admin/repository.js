const { Admin } = require('../../core/database');

class AdminRepository {

    static async findByEmail(email) {
        return await Admin.findOne({
            where: {
                email: email
            }
        });
    }

    static async create(adminData) {
        return await Admin.create(adminData);
    }

}

module.exports = AdminRepository;