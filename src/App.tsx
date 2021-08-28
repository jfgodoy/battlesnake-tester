import { Component, Switch, Match } from "solid-js";
import ConfigComponent from "./components/config";
import ImporterComponent from "./components/importer";
import DisplayTest from "./components/display-test";
import TestList from "./components/test-list";
import { themes } from "./theme";
import * as core from "./core";

const App: Component = () => {
  const [server, setServer] = core.signalFor("server");
  const [view, setView] = core.signalFor("view");
  const [testResults, _] = core.signalFor("testResults");
  const [style, setStyle] = core.signalFor("testedSnake.style");
  const selectedSignal = core.signalFor("selected");

  return (
    <div class="flex flex-col h-screen">
      <header>
        <div class="p-4" style="background-color:#72268c;">
          <h1 class="text-center text-white text-2xl font-semibold tracking-wide">Battlesnake Tester</h1>
        </div>
        <div class="p-4 bg-white" style="box-shadow:0 1px 1px 1px rgb(18 106 211 / 8%);" >
          <ConfigComponent
            server={[server, setServer]}
            style={[style, setStyle]}
            setView={setView}
          />
        </div>
      </header>
      <div class="flex flex-1 flex-row mt-1 overflow-hidden">
        <aside class="flex bg-white w-80 p-4">
          <TestList
            runAllTests={core.runAllTests}
            selected={selectedSignal}
            setView={setView}
            testResults={testResults}
          />
        </aside>
        <main class="flex-1 p-4">
          <div class="flex">
            <Switch>
              <Match when={view() == "test" && core.selectedTestResult()}>
                <DisplayTest
                  mySnakeStyle={style}
                  theme={themes.light}
                  testResult={core.selectedTestResult}
                  runSingleTest={core.runSingleTest}
                  readTest={core.readTest}
                />
              </Match>
              <Match when={view() == "importer"}>
                <ImporterComponent
                  theme={themes.light}
                  server={server}
                  saveTest={core.saveTest}
                />
              </Match>
            </Switch>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
