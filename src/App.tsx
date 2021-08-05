import { Component, Show, createResource } from "solid-js";

import styles from "./App.module.css";
import Board from "./ components/board";

import { formatFrame } from "./utils/game-state";
import { prepareFrame } from "./utils/engine-client";
import { themes } from "./theme";


const App: Component = () => {
  const columns = 11;
  const rows = 11;

  const raw_frame = {"Turn":106,"Snakes":[{"ID":"gs_wvYGXWvhGg3SQgDTPqG9fXHT", "Name":"cc-battlesnake","URL":"", "Body":[{"X":9,"Y":11},{"X":9,"Y":10},{"X":9,"Y":9}],"Health":98,"Death":{"Cause":"wall-collision","Turn":2,"EliminatedBy":""},"Color":"#4d004d","HeadType":"silly","TailType":"pixel","Latency":"0","Shout":"","Squad":"","APIVersion":"","Author":"ccntrq"},{"ID":"gs_xjwhQm9cPypTFGPXWd9jW6M8","Name":"samees noodle","URL":"","Body":[{"X":6,"Y":6},{"X":6,"Y":5},{"X":7,"Y":5},{"X":8,"Y":5},{"X":9,"Y":5},{"X":9,"Y":6},{"X":9,"Y":7},{"X":10,"Y":7},{"X":10,"Y":6},{"X":10,"Y":5}],"Health":98,"Death":null,"Color":"#800000","HeadType":"default","TailType":"default","Latency":"220","Shout":"","Squad":"","APIVersion":"","Author":"s11mee"},{"ID":"gs_TKy349Q3d4H8mBQMxJqCY7QB","Name":"Lil Battlesnake","URL":"","Body":[{"X":1,"Y":1},{"X":1,"Y":0},{"X":0,"Y":0},{"X":0,"Y":1}],"Health":67,"Death":null,"Color":"#600080","HeadType":"beluga","TailType":"hook","Latency":"69","Shout":"","Squad":"","APIVersion":"","Author":"JeMorriso"},{"ID":"gs_gWfjdqVttw9G4hcQjHDFMRrK","Name":"caicai-vilu","URL":"","Body":[{"X":1,"Y":2},{"X":2,"Y":2},{"X":2,"Y":1},{"X":2,"Y":0},{"X":3,"Y":0},{"X":3,"Y":1},{"X":3,"Y":2},{"X":3,"Y":3},{"X":2,"Y":3},{"X":1,"Y":3},{"X":1,"Y":4}],"Health":97,"Death":{"Cause":"snake-collision","Turn":51,"EliminatedBy":"gs_TKy349Q3d4H8mBQMxJqCY7QB"},"Color":"#1974D3","HeadType":"default","TailType":"default","Latency":"67","Shout":"","Squad":"","APIVersion":"","Author":"jfgodoy"}],"Food":[{"X":7,"Y":6},{"X":0,"Y":9},{"X":4,"Y":4},{"X":8,"Y":2},{"X":8,"Y":10},{"X":5,"Y":4},{"X":7,"Y":10},{"X":3,"Y":2},{"X":0,"Y":5},{"X":9,"Y":0}],"Hazards":[]}
  const getCurrentFrame = async (fr) => {
    await prepareFrame(fr);
    return formatFrame(fr);
  };

  const [currentFrame] = createResource(raw_frame, getCurrentFrame);

  return (
    <div class={styles.Board}>
      <Show when={!currentFrame.loading}>
        <Board
          snakes={currentFrame().snakes}
          food={currentFrame().food}
          foodImage=""
          hazards={currentFrame().hazards}
          columns={columns}
          rows={rows}
          highlightedSnake={null}
          theme={themes.light}
          turn={currentFrame().turn}
        />
      </Show>
    </div>
  );
};

export default App;
