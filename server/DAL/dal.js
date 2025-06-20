// DAL/dal.js
const { Op } = require('sequelize'); // אם תרצה להשתמש באופרטורים מתקדמים יותר בעתיד

async function create(model, data) {
    return await model.create(data);
}

// options יכול לכלול include, where, attributes ועוד
async function findAll(model, options = {}) {
    try {
        return await model.findAll(options);
    } catch (err) {
        console.error("🔥 Sequelize findAll error for model", model.name, ":", err);
        throw err;
    }
}

/**
 * מוצא רשומה יחידה במודל על פי תנאים.
 * מחזיר אובייקט של Sequelize אם נמצא, אחרת null.
 * @param {object} model - מודל ה-Sequelize.
 * @param {object} options - אובייקט אפשרויות הכולל where, include, attributes ועוד.
 * @returns {object|null} - אובייקט המודל או null.
 */
async function findOne(model, options = {}) {
    try {
        return await model.findOne(options);
    } catch (err) {
        console.error("🔥 Sequelize findOne error for model", model.name, ":", err);
        throw err;
    }
}

async function findById(model, id, options = {}) {
    return await model.findByPk(id, options);
}

async function update(model, id, data) {
    const [updatedCount] = await model.update(data, { where: { id } });
    return updatedCount > 0;
}

async function remove(model, id) {
    const deletedCount = await model.destroy({ where: { id } });
    return deletedCount > 0;
}

async function removeWhere(model, where) {
    const deletedCount = await model.destroy({ where });
    return deletedCount > 0;
}

module.exports = {
    create,
    findAll,
    findOne, // הוספה חדשה
    findById,
    update,
    remove,
    removeWhere
};