import { logger } from '@shared';
import { Request, Response, Router } from 'express';
import { BAD_REQUEST, OK } from 'http-status-codes';
import query from 'src/query/query';
import {
  IncidentCharacteristic,
  Participant,
  Gun,
  Incident,
  Location,
  StatePopulation,
} from 'src/table';

// Init shared
const router = Router();

/**
 * Returns the characteristics associated with the given incident ID.
 */
router.get('/:id/characteristics', async (req: Request, res: Response) => {
  try {
    const characteristics = await query(
      `SELECT incident_characteristic
      FROM ${IncidentCharacteristic} WHERE incident_id = ${req.params.id}`
    );
    return res.status(OK).json(characteristics);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * Returns participant info for the incident with the given ID.
 */
router.get('/:id/participants', async (req: Request, res: Response) => {
  try {
    const participants = await query(
      `SELECT p.id, p.name, p.age, p.gender, p.type, p.status, p.relationship
      FROM ${Participant} p WHERE p.incident_id = ${req.params.id}`
    );
    return res.status(OK).json(participants);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * Returns gun info for the incident with the given ID.
 */
router.get('/:id/guns', async (req: Request, res: Response) => {
  try {
    const guns = await query(
      `SELECT g.id, g.type, g.stolen
      FROM ${Gun} g WHERE g.incident_id = ${req.params.id}`
    );
    return res.status(OK).json(guns);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * Returns all distinct characteristics that an incident may have.
 */
router.get('/characteristics', async (req: Request, res: Response) => {
  try {
    const characteristics = await query(
      `SELECT DISTINCT incident_characteristic 
       FROM ${IncidentCharacteristic}
       ORDER BY incident_characteristic`
    );
    return res.status(OK).json(characteristics);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * Returns casualties per year: 2013, 2014, 2015, 2016, 2017, 2018
 */
router.get('/deathsPerYear', async (req: Request, res: Response) => {
  try {
    const casualtiesPerYear = await query(
      `SELECT SUM(n_killed) AS deaths
      FROM ${Incident}
      GROUP BY extract(year FROM i_date)
      ORDER BY extract(year FROM i_date) ASC`
    );
    return res.status(OK).json(casualtiesPerYear);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * Returns national population per year: 2013, 2014, 2015, 2016, 2017, 2018
 */
router.get('/populationPerYear', async (req: Request, res: Response) => {
  try {
    const populationPerYear = await query(
      `SELECT SUM(population) AS populations
      FROM ${StatePopulation}
      GROUP BY year
      ORDER BY year ASC`
    );
    return res.status(OK).json(populationPerYear);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

/**
 * Returns top n deadliest incidents.
 */
router.get('/deadliest/:n', async (req: Request, res: Response) => {
  try {
    const deadliestIncidents = await query(
      `SELECT * FROM
      (SELECT ${Location}.city_or_county||','||state||' '||i_date AS label, n_killed
      FROM ${Incident}, ${Location}
      WHERE ${Incident}.latitude = ${Location}.latitude
      AND ${Incident}.longitude = ${Location}.longitude
      ORDER BY n_killed DESC)
      WHERE ROWNUM <= ${req.params.n}`
    );
    return res.status(OK).json(deadliestIncidents);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

export default router;
