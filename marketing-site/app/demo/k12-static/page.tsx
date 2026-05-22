"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "./_loading";
import Sidebar from "./_sidebar";
import HeaderBar from "./_header";
import FloatingInfo from "./_floating-info";
import DashboardKpi from "./sections/dashboard-kpi";
import ReportsCharts from "./sections/reports-charts";
import FeatureModules from "./sections/feature-modules";
import DeviceSchedule from "./sections/device-schedule";
import TeachersActivities from "./sections/teachers-activities";
import ProjectsCompetitions from "./sections/projects-competitions";
import StudentCommunity from "./sections/student-community";
import TeachingAids from "./sections/teaching-aids";
import SettingsPage from "./sections/settings";

function renderSection(menuId: string) {
  switch (menuId) {
    case "dashboard":
      return (
        <>
          <DashboardKpi />
          <ReportsCharts />
          <FeatureModules />
        </>
      );
    case "community":
      return <StudentCommunity />;
    case "clubs":
      return <FeatureModules />;
    case "devices":
    case "schedule":
      return <DeviceSchedule />;
    case "aids":
      return <TeachingAids />;
    case "projects":
    case "competitions":
      return <ProjectsCompetitions />;
    case "teachers":
      return <TeachersActivities />;
    case "reports":
      return <ReportsCharts />;
    case "students":
      return <DashboardKpi />;
    case "settings":
      return <SettingsPage />;
    default:
      return <DashboardKpi />;
  }
}

export default function DemoK12Static() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar activeMenu={activeMenu} onMenuClick={setActiveMenu} />

      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar />

        <main className="flex-1 p-6 overflow-y-auto space-y-5">
          {renderSection(activeMenu)}
        </main>

        <FloatingInfo />
      </div>
    </div>
  );
}
