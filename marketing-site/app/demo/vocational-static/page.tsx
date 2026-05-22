"use client";

import { useState, useEffect } from "react";
import Loading from "./_loading";
import Sidebar from "./_sidebar";
import HeaderBar from "./_header";
import FloatingInfo from "./_floating-info";
import DashboardKpi from "./sections/dashboard-kpi";
import AnalyticsCharts from "./sections/analytics-charts";
import FeatureCards from "./sections/feature-cards";
import EquipmentSchedule from "./sections/equipment-schedule";
import TeachersActivities from "./sections/teachers-activities";
import CooperationIncubator from "./sections/cooperation-incubator";
import Consumables from "./sections/consumables";
import CompetitionsEmploymentAcademic from "./sections/competitions-employment-academic";
import SettingsPage from "./sections/settings";

function renderSection(menuId: string) {
  switch (menuId) {
    case "dashboard":
      return (
        <>
          <DashboardKpi />
          <AnalyticsCharts />
          <FeatureCards />
        </>
      );
    case "equipment":
      return <EquipmentSchedule />;
    case "consumables":
      return <Consumables />;
    case "cooperation":
    case "incubator":
      return <CooperationIncubator />;
    case "competitions":
    case "employment":
    case "academic":
      return <CompetitionsEmploymentAcademic />;
    case "teachers":
      return <TeachersActivities />;
    case "analytics":
      return <AnalyticsCharts />;
    case "students":
      return <DashboardKpi />;
    case "settings":
      return <SettingsPage />;
    default:
      return <DashboardKpi />;
  }
}

export default function DemoVocationalStatic() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 600); return () => clearTimeout(t); }, []);

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeMenu={activeMenu} onMenuClick={setActiveMenu} />
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {renderSection(activeMenu)}
        </main>
        <FloatingInfo />
      </div>
    </div>
  );
}
