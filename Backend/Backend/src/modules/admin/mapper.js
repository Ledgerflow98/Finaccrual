'use strict';

/**
 * AdminMapper
 * -----------------------------------------------------------------
 * Transforms raw Admin database records into clean, safe DTOs.
 * Strips sensitive fields (e.g. password) before returning data
 * to the Controller or the client.
 * -----------------------------------------------------------------
 */
class AdminMapper {

    /**
     * Map a raw Admin database record -> safe AdminDTO (no password)
     * @param {object} raw - Sequelize Admin model instance
     * @returns {{ id, name, email }}
     */
    static toAdminDTO(raw) {
        return {
            id:    raw.id    || '',
            name:  raw.name  || '',
            email: raw.email || ''
        };
    }
}

module.exports = AdminMapper;
