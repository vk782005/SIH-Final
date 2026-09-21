import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Overview from "./sections/Overview/Overview";
import Explorer from "./sections/Explorer/Explorer";
import Regions from "./sections/Regions/Regions";
import Analysis from "./sections/Analysis/Analysis";
import DataCenter from "./sections/DataCenter/DataCenter";
import AIResearch from "./sections/AIResearch/AIResearch";
import Anomalies from "./sections/Anomalies/Anomalies";
import Investigations from "./sections/Investigations/Investigations";
import Projects from "./sections/Projects/Projects";
import Reports from "./sections/Reports/Reports";
import Tasks from "./sections/Tasks/Tasks";
import SavedViews from "./sections/SavedViews/SavedViews";
import Alerts from "./sections/Alerts/Alerts";
import Settings from "./sections/Settings/Settings";
import DepthAnalysisPage from "../DepthAnalysisPage/DepthAnalysisPage";
import "./ResearchWorkspace.css";

const pages = {
  overview: Overview,
  explorer: Explorer,
  regions: Regions,
  analysis: Analysis,
  data: DataCenter,
  ai: AIResearch,
  anomalies: Anomalies,
  investigations: Investigations,
  projects: Projects,
  reports: Reports,
  tasks: Tasks,
  saved: SavedViews,
  alerts: Alerts,
  settings: Settings,
  depth: DepthAnalysisPage,
};

function ResearchWorkspace({ onOpenGlobe, onAddData, onLogout, initialPage = "overview" }) {
  const [activePage, setActivePage] = useState(initialPage);

  const Page = pages[activePage] || Overview;

  return (
    <div className="research-workspace">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={onLogout}
      />

      <div className="research-main">
        <Topbar
          activePage={activePage}
          onNavigate={setActivePage}
        />

        <main className="research-content">
          <Page
            onOpenGlobe={onOpenGlobe}
            onAddData={onAddData}
            onNavigate={setActivePage}
          />
        </main>
      </div>
    </div>
  );
}

export default ResearchWorkspace;
