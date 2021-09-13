import htmlParser from "node-html-parser";
import fetch from "node-fetch";
import fs from "fs/promises";

const url = process.argv[2];

async function loadSVGs(dir) {
  const headFiles = (await fs.readdir(dir))
    .filter(file => file.endsWith(".svg"));

  const promises = headFiles.map(async file => {
      const content = await fs.readFile(`${dir}/${file}`, "utf-8");
      const contentCleaned = htmlParser.parse(content).removeWhitespace().toString();
      const name = file.replace(".svg", "");
      return [name, contentCleaned];
    });

  const pairs = await Promise.all(promises);

  const dict = pairs.reduce((acc, [name, content]) => { acc[name] = content; return acc; }, {});
  return dict;
}

async function run() {
  const headsDic = await loadSVGs("src/assets/snakes/heads");
  const tailsDic = await loadSVGs("src/assets/snakes/tails");
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

      /* snake style */
      const td_snake = row.querySelector("td[class=\"arena-leaderboard-snake\"]");
      const style_snake = td_snake.querySelector("style");
      const match = /fill: (#[0-9a-fA-F]{6});/.exec(style_snake.toString());
      const color = match[1];
      const svg_snake_head = td_snake.querySelector(".d-snake-head svg");
      const svg_head_text = svg_snake_head.removeWhitespace().toString();
      const svg_snake_tail = td_snake.querySelector(".d-snake-tail svg");
      const svg_tail_text = svg_snake_tail.removeWhitespace().toString();
      const head = Object.entries(headsDic).find(([, v]) => v == svg_head_text)[0];
      const tail = Object.entries(tailsDic).find(([, v]) => v == svg_tail_text)[0];

      const snake_data = {
        id: attrs["data-snake-id"],
        name: attrs["data-snake-name"],
        color: color,
        head: head,
        tail: tail,
        rkg: rkg,
        rating: rating,
      };

      return snake_data;
    })
    .filter(v => !!v);

  console.log(JSON.stringify({date: new Date(), leaderboard}));
}

run();
