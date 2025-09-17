const router = require('express').Router();
const pool = require('../db');

// GET /api/films/top -> Top 5 rented films of all time
router.get('/top', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const [rows] = await pool.query(
      `
      SELECT f.film_id, f.title, c.name AS category, COUNT(r.rental_id) AS rental_count
      FROM rental r
      JOIN inventory i ON r.inventory_id = i.inventory_id
      JOIN film f      ON i.film_id = f.film_id
      JOIN film_category fc ON fc.film_id = f.film_id
      JOIN category c  ON c.category_id = fc.category_id
      GROUP BY f.film_id, f.title, c.name
      ORDER BY rental_count DESC, f.title
      LIMIT ?
      `,
      [limit]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const filmId = Number(req.params.id);

    // 1) core info + category
    const [[film]] = await pool.query(
      `SELECT f.film_id, f.title, f.description, f.rating, f.length, f.release_year,
              c.name AS category
       FROM film f
       JOIN film_category fc ON fc.film_id = f.film_id
       JOIN category c ON c.category_id = fc.category_id
       WHERE f.film_id = ?`,
      [filmId]
    );
    if (!film) return res.status(404).json({ error: 'Film not found' });

    // 2) actors
    const [actors] = await pool.query(
      `SELECT a.actor_id, a.first_name, a.last_name
       FROM actor a
       JOIN film_actor fa ON fa.actor_id = a.actor_id
       WHERE fa.film_id = ?
       ORDER BY a.last_name, a.first_name`,
      [filmId]
    );

    // 3) stock per store (total/out/available)
    const [stock] = await pool.query(
      `SELECT s.store_id,
              COUNT(i.inventory_id)                                    AS total_copies,
              COALESCE(SUM(CASE WHEN r.return_date IS NULL THEN 1 END),0) AS out_rented,
              COUNT(i.inventory_id) - COALESCE(SUM(CASE WHEN r.return_date IS NULL THEN 1 END),0) AS available
       FROM store s
       JOIN inventory i ON i.store_id = s.store_id
       LEFT JOIN rental r ON r.inventory_id = i.inventory_id AND r.return_date IS NULL
       WHERE i.film_id = ?
       GROUP BY s.store_id
       ORDER BY s.store_id`,
      [filmId]
    );

    res.json({ ...film, actors, stock });
  } catch (e) {
    next(e);
  }
});

module.exports = router;