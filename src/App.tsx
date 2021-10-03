import { Component, Switch, Match, createSignal, createMemo, on, PropsWithChildren } from "solid-js";
import HeaderBarComponent from "./components/header-bar";
import ImporterComponent from "./components/importer";
import DisplayTest from "./components/display-test";
import TestList from "./components/test-list";
import Home from "./components/home";
import ExportImportDBComponent from "./components/export-import-db";
import { Getter } from "./solid-utils";
import * as core from "./core";
import BoardBuilder from "./components/board-builder";
import RecentGames from "./components/recent-games";

const App: Component = () => {
  const [server, setServer] = core.signalFor("server");
  const [view, setViewRaw] = core.signalFor("view");
  const [testResults, _] = core.signalFor("testResults");
  const [style, setStyle] = core.signalFor("testedSnake.style");
  const [dbStatus] = core.signalFor("dbStatus");
  const [snakeUrl, setSnakeUrl] = core.signalFor("snakeUrl");
  const selectedSignal = core.signalFor("selected");
  const [tick, setTick] = createSignal(true);

  const setView = (view: string) => {
    setViewRaw(view);
    setTick(!tick());
  };

  function Refresh<T>(props: PropsWithChildren<{on: Getter<T>}>) {
    return createMemo(on(props.on, () => props.children));
  }

  return (
    <div class="flex flex-col h-screen min-w-max">
      <header>
        <div class="p-4" style="background-color:#72268c;">
          <h1 class="text-center text-white text-2xl font-semibold tracking-wide" onclick={() => setView("home")}>Battlesnake Tester</h1>
        </div>
        <div class="p-4 bg-white" style="box-shadow:0 1px 1px 1px rgb(18 106 211 / 8%);" >
          <HeaderBarComponent
            server={[server, setServer]}
            style={[style, setStyle]}
            setView={setView}
            createEmptyTest={core.createEmptyTest}
          />
        </div>
      </header>
      <div class="flex flex-1 flex-row mt-1 overflow-hidden">
        <aside class="flex bg-white w-80 p-4 shadow">
          <TestList
            runAllTests={core.runAllTests}
            selected={selectedSignal}
            setView={setView}
            testResults={testResults}
            importExamples={core.importExamples}
            dbStatus={dbStatus}
          />
        </aside>
        <main class="flex flex-1 flex-col p-4 overflow-y-auto">
          <div class="flex">
            <Switch>
              <Match when={view() == "home"}>
                <Home />
              </Match>
              <Match when={view() == "test" && core.selectedTestResult()}>
                <DisplayTest
                  mySnakeStyle={style}
                  testResult={core.selectedTestResult}
                  runSingleTest={core.runSingleTest}
                  runUnsavedTest={core.runUnsavedTest}
                  readTest={core.readTest}
                  deleteTest={core.deleteTest}
                  saveTest={core.saveTest}
                  asCurl={core.asCurl}
                  asJson={core.asJson}
                  setView={setView}
                />
              </Match>
              <Match when={view() == "importer"}>
                <Refresh on={tick}>
                  <ImporterComponent
                    server={server}
                    saveTest={core.saveTest}
                    setView={setView}
                  />
                </Refresh>
              </Match>
              <Match when={view() == "exportimportdb"}>
                  <ExportImportDBComponent
                    exportToJson={core.exportToJson}
                    importFromJson={core.importFromJson}
                  />
              </Match>
              <Match when={view() == "builder" && core.selectedTestResult()}>
                <Refresh on={tick}>
                  <BoardBuilder
                    testResult={core.selectedTestResult}
                    readTest={core.readTest}
                    saveTest={core.saveTest}
                    setView={setView}
                  />
                </Refresh>
              </Match>
            </Switch>
          </div>
          <div class="flex flex-1 items-end">
            <a class="m-4 text-gray-500 hover:text-blue-400 text-sm" target="_blank" href="https://play.battlesnake.com/">Assets used with permission from Battlesnake</a>
          </div>
        </main>
        <aside class="flex bg-white w-80 shadow">
          <RecentGames saveTest={core.saveTest} setView={setView} snakeUrl={snakeUrl} setSnakeUrl={setSnakeUrl} />
        </aside>
      </div>
    </div>
  );
};

export default App;
