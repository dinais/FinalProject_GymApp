

async function create(model, data) {
  return await model.create(data);
}

async function findAll(model, options = {}) {
  // options יכול לכלול include, where, attributes ועוד
  return await model.findAll(options);
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

module.exports = {
  create,
  findAll,
  findById,
  update,
  remove
};
