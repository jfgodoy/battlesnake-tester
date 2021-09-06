import { JSX } from "solid-js";

export default function Home(): JSX.Element {
  return (
    <div class="flex flex-col m-4 p-6 bg-white max-w-4xl text-gray-700 shadow">
      <h1 class="py-4 text-2xl text-gray-500 font-semibold">Welcome!</h1>
      <p>
        This app allow you to import games played in <a target="_blank" class="text-purple-600" href="https://play.battlesnake.com/">https://play.battlesnake.com/</a>, navigate all the turns and create tests
    for your server. The tests created are saved locally in your browser in a IndexedDB database.
      </p>
      <h2 class="py-4 text-xl">Get's start</h2>
      <ul>
        <li>1.- config your server on the top left input.</li>
        <li>2.- create a new test importing a game from <a target="_blank" class="text-purple-600" href="https://play.battlesnake.com/">https://play.battlesnake.com/</a>.</li>
        <li>3.- Set the name and expected result.</li>
      </ul>
      <p class="my-2">That's all! You can run a single test or all at once.</p>

      <p class="mt-4">
        This project is in active development. Visit the <a target="_blank" class="text-purple-600" href="https://github.com/jfgodoy/battlesnake-tester">github repository</a> and leave suggestions of new features.
      </p>
    </div>
    );
}
