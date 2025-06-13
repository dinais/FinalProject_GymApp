const db = require('../../DAL/dal');
const { lesson} = require('../../../DB/models');
const { Op } = require('sequelize');

const getLessonsByWeek = async (req, res) => {
  try {
    const { weekStart } = req.query;
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const all_lessons = await db.findAll(lesson, {
      where: {
        start_date: {
          [Op.gte]: start,
          [Op.lt]: end,
        },
      },
    });

    res.json(all_lessons);
  } catch (err) {
    console.error('Error fetching lessons:', err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
};

module.exports = {
  getLessonsByWeek,
};
