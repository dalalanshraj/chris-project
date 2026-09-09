import ical from "node-ical";

export const getBlockedDates = async (req, res) => {
  try {
    const url = ""; 

    const data = await ical.async.fromURL(url);

    const ranges = [];

    for (let key in data) {
      const event = data[key];

      if (event.type === "VEVENT") {
        ranges.push({
          start: event.start,
          end: event.end,
        });
      }
    }

    res.json(ranges);
  } catch (err) {
    res.status(500).json({ error: "iCal fetch failed" });
  }
};