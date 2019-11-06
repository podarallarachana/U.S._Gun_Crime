import { logger } from '@shared';
import { Request, Response, Router } from 'express';
import { BAD_REQUEST, OK } from 'http-status-codes';
import query from 'src/query/query';

// Init shared
const router = Router();

// Client-side data sent as a POST payload
interface FormData {
  characteristics: string[];
  numKilled: { equality: string; count: number };
  numInjured: { equality: string; count: number };
  dateRange: [string, string];
  numGuns: { equality: string; count: number };
  gunTypes: string[];
  participant: {
    qualifier: 'any' | 'only';
    gender: 'Any' | 'M' | 'F';
    age: { equality: string; count: number };
    type: string;
    status: string;
    relationship: string;
  };
  usState: string;
  cityOrCounty: string;
  houseDistrict: string;
  senateDistrict: string;
}

export const quoteAndSeparateWithCommas = (data: string[]) => {
  return "'" + data.join("','") + "'";
};

const invert = (equalitySymbol: string) => {
  switch (equalitySymbol) {
    case '>=':
      return '<';
    case '>':
      return '<=';
    case '=':
      return '<>';
    case '<=':
      return '>';
    case '<':
      return '>=';
  }
};

/******************************************************************************
 *                        See deep dive tool in frontend
 ******************************************************************************/

router.post('', async (req: Request, res: Response) => {
  const data: FormData = req.body;

  logger.info('/api/deepDive endpoint received this data:');
  console.log(data);

  const participant = data.participant;

  const ageEquality =
    participant.qualifier === 'only'
      ? invert(participant.age.equality)
      : participant.age.equality;

  let participantQuery;

  if (participant.qualifier === 'any') {
    participantQuery = `
    SELECT id, incident_id FROM Participant
    WHERE (
      age IS NOT NULL AND age${ageEquality}${participant.age.count}
      ${
        participant.gender !== 'Any'
          ? ` AND gender IS NOT NULL AND gender='${participant.gender}'`
          : ''
      }
      ${
        participant.type
          ? ` AND type IS NOT NULL AND type='${participant.type}'`
          : ''
      }
      ${
        participant.status
          ? ` AND status IS NOT NULL AND status='${participant.status}'`
          : ''
      }
      ${
        participant.relationship
          ? ` AND relationship IS NOT NULL AND relationship='${participant.relationship}'`
          : ''
      }
    )
    `;
  } else {
    // In this case, we get the set difference between all participants
    // and those participants not matching any of the conditions.
    // Applying DeMorgan's laws yields ORs, IS NULLs, and <> in place of
    // AND, IS NOT NULL, and =, respectively.
    participantQuery = `
    SELECT id, incident_id FROM Participant
    MINUS
    (
    SELECT id, incident_id FROM Participant
    WHERE (
      age IS NULL OR age${ageEquality}${participant.age.count}
      ${
        participant.gender !== 'Any'
          ? ` OR gender IS NULL OR gender<>'${participant.gender}'`
          : ''
      }
      ${
        participant.type
          ? ` OR type IS NULL OR type<>'${participant.type}'`
          : ''
      }
      ${
        participant.status
          ? ` OR status IS NULL OR status<>'${participant.status}'`
          : ''
      }
      ${
        participant.relationship
          ? ` OR relationship IS NULL OR relationship<>'${participant.relationship}'`
          : ''
      }
    )
    )`;
  }

  // TODO: return multi-valued attributes; squash duplicate incidents into one in the frontend maybe?
  const queryString = `
    SELECT DISTINCT i.incident_id, n_participants, i_date AS incident_date, n_killed, n_injured, notes, source_url,
    n_guns_involved, Location.latitude, Location.longitude, state, city_or_county, state_house_district, state_senate_district
    FROM
    (
    SELECT Incident.id AS incident_id,  COUNT(DISTINCT p.id) AS n_participants
    FROM Incident INNER JOIN IncidentCharacteristic ON Incident.id = IncidentCharacteristic.incident_id
    INNER JOIN Location ON Incident.latitude = Location.latitude AND Incident.longitude = Location.longitude
    INNER JOIN Gun ON Incident.id = Gun.incident_id
    INNER JOIN (${participantQuery}) p ON Incident.id = p.incident_id 
    WHERE 
    n_killed${data.numKilled.equality}${data.numKilled.count}
    AND n_injured${data.numInjured.equality}${data.numInjured.count}
    ${
      data.characteristics.length
        ? `AND incident_characteristic IN (${quoteAndSeparateWithCommas(
            data.characteristics
          )})`
        : ''
    }
    ${
      data.dateRange[0]
        ? `AND i_date BETWEEN TO_DATE('${data.dateRange[0]}', 'MM/DD/YYYY') AND TO_DATE('${data.dateRange[1]}', 'MM/DD/YYYY')`
        : ''
    }
    AND n_guns_involved${data.numGuns.equality}${data.numGuns.count}
    ${
      data.gunTypes.length
        ? `AND type IN (${quoteAndSeparateWithCommas(data.gunTypes)})`
        : ''
    }
    ${data.usState ? `AND state='${data.usState}'` : ''}
    ${data.cityOrCounty ? `AND city_or_county='${data.cityOrCounty}'` : ''}
    ${data.houseDistrict ? `AND house_district=${data.houseDistrict}` : ''}
    ${data.senateDistrict ? `AND senate_district=${data.senateDistrict}` : ''}
    GROUP BY Incident.id
    ) i
    INNER JOIN Incident ON i.incident_id = Incident.id
    INNER JOIN Location ON Incident.latitude = Location.latitude AND Incident.longitude = Location.longitude
    INNER JOIN Gun ON Incident.id = Gun.incident_id
    ORDER BY incident_date
  `;

  logger.info('Attempting to execute this query:');
  console.log(queryString);

  try {
    const incidents = await query(queryString);
    return res.status(OK).json(incidents);
  } catch (err) {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  }
});

export default router;
