"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "./_loading";
import Sidebar from "./_sidebar";
import HeaderBar from "./_header";
import DashboardKpi from "./sections/dashboard-kpi";
import CoverageReport from "./sections/coverage-report";
import FeatureCards from "./sections/feature-cards";
import SchoolRanking from "./sections/school-ranking";
import Equipment from "./sections/equipment";
import SharingRequests from "./sections/sharing-requests";
import Training from "./sections/training";
import CompetitionsBudget from "./sections/competitions-budget";
import Curriculum from "./sections/curriculum";
import SettingsPage from "./sections/settings";

function renderSection(menuId: string) {
  switch (menuId) {
    case "dashboard":
      return (
        <>
          <DashboardKpi />
          <CoverageReport />
        </>
      );
    case "schools":
      return <SchoolRanking />;
    case "equipment":
      return (
        <>
          <Equipment />
          <SharingRequests />
        </>
      );
    case "training":
      return <Training />;
    case "competitions":
    case "budget":
      return <CompetitionsBudget />;
    case "curriculum":
      return <Curriculum />;
    case "reports":
      return <CoverageReport />;
    case "settings":
      return <SettingsPage />;
    default:
      return (
        <>
          <DashboardKpi />
          <CoverageReport />
        </>
      );
  }
}

export default function DemoBureauStatic() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeMenu={activeMenu} onMenuClick={setActiveMenu} />

      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar />

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {renderSection(activeMenu)}
        </main>
      </div>
    </div>
  );
}
