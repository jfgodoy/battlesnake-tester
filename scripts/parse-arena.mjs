import htmlParser from "node-html-parser";
import fetch from "node-fetch";

const url = process.argv[2];

async function run() {
  const text = await fetch(url).then(res => res.text());
  const root = htmlParser.parse(text);

  const leaderboard = root.querySelectorAll("tr")
    .map(row => {
      const attrs = row.attributes;
      if (!attrs["data-snake-id"]) {
        return null;
      }

      const td_rkg = row.querySelector("td[class=\"arena-leaderboard-rank\"]");
      const rkg = td_rkg.textContent.trim();

      const td_rating = row.querySelector("td[class=\"arena-leaderboard-rating\"]");
      const rating = td_rating.textContent.trim();

      const snake_data = {
        id: attrs["data-snake-id"],
        name: attrs["data-snake-name"],
        rkg: rkg,
        rating: rating,
      };

      return snake_data;
    })
    .filter(v => !!v);

  console.log(JSON.stringify({date: new Date(), leaderboard}));
}

run();
