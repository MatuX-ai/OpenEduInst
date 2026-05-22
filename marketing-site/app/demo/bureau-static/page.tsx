"use client";

import { useState, useEffect } from "react";
import LoadingScreen from "./_loading";
import Sidebar from "./_sidebar";
import HeaderBar from "./_header";
import FloatingInfo from "./_floating-info";
import DashboardKpi from "./sections/dashboard-kpi";
import CoverageReport from "./sections/coverage-report";
import FeatureCards from "./sections/feature-cards";
import SchoolRanking from "./sections/school-ranking";
import EquipmentTraining from "./sections/equipment-training";
import SharingRequests from "./sections/sharing-requests";
import CompetitionsBudget from "./sections/competitions-budget";
import Curriculum from "./sections/curriculum";

export default function DemoBureauStatic() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const scrollToSection = (id: string) => {
    setActiveMenu(id);
    const el = document.getElementById(`section-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeMenu={activeMenu} onMenuClick={scrollToSection} />

      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar />

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          <DashboardKpi />
          <CoverageReport />
          <FeatureCards />
          <SchoolRanking />
          <EquipmentTraining />
          <SharingRequests />
          <CompetitionsBudget />
          <Curriculum />
        </main>

        <FloatingInfo />
      </div>
    </div>
  );
}
