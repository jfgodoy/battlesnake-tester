import { JSX } from "solid-js";

export default function Home(): JSX.Element {
  return (
    <div class="flex flex-col m-4 p-6 bg-white max-w-4xl text-gray-700">
      <h1 class="py-4 text-2xl text-gray-500 font-semibold">Welcome!</h1>
      <p>
        This app allow you to import games played in <a target="_blank" class="text-purple-600" href="https://play.battlesnake.com/">https://play.battlesnake.com/</a>, navigate all the turns and create tests
    for your server. The test created are saved locally in your browser in a IndexedDB database.
      </p>
      <h2 class="py-4 text-xl">Get's start</h2>
      <ul>
        <li>1.- config your server on the top left input.</li>
        <li>2.- import a game from <a target="_blank" class="text-purple-600" href="https://play.battlesnake.com/">https://play.battlesnake.com/</a>.</li>
        <li>3.- Set the name and expected result.</li>
      </ul>
      <p class="my-2">That's all! add as many test as you want</p>
    </div>
    );
}
