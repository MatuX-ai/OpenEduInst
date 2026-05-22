"use client";

import { useState, useEffect } from "react";
import Loading from "./_loading";
import Sidebar from "./_sidebar";
import HeaderBar from "./_header";
import DashboardKpi from "./sections/dashboard-kpi";
import RevenueTokens from "./sections/revenue-tokens";
import FeatureActions from "./sections/feature-actions";
import DeviceSchedule from "./sections/device-schedule";
import TeachersActivities from "./sections/teachers-activities";
import SettingsPage from "./sections/settings";

function renderSection(menuId: string) {
  switch (menuId) {
    case "dashboard":
      return (
        <>
          <DashboardKpi />
          <RevenueTokens />
          <FeatureActions />
        </>
      );
    case "leads":
    case "billing":
      return <DashboardKpi />;
    case "schedule":
    case "devices":
      return <DeviceSchedule />;
    case "projects":
      return <FeatureActions />;
    case "tokens":
    case "reports":
      return <RevenueTokens />;
    case "settings":
      return <SettingsPage />;
    default:
      return (
        <>
          <DashboardKpi />
          <RevenueTokens />
        </>
      );
  }
}

export default function DemoTrainingStatic() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 600); return () => clearTimeout(t); }, []);

  if (isLoading) return <Loading />;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar activeMenu={activeMenu} onMenuClick={setActiveMenu} />
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar />
        <main className="flex-1 p-6 overflow-y-auto space-y-4">
          {renderSection(activeMenu)}
        </main>
      </div>
    </div>
  );
}
