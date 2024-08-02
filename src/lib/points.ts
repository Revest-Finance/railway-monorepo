import _ from "lodash";

const SERVICE_URL = "https://repoints.up.railway.app/points";

export async function getPoints(startDate: Date, endDate: Date) {
  const requestBody = _.mapKeys(
    {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
    (__, key) => _.snakeCase(key)
  );

  const response = await fetch(SERVICE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    return [];
  }
  return await response.json();
}
