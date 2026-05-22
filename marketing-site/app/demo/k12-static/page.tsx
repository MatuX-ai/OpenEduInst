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

export default function DemoK12Static() {
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
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar activeMenu={activeMenu} onMenuClick={scrollToSection} />

      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar />

        <main className="flex-1 p-6 overflow-y-auto space-y-5">
          <DashboardKpi />
          <ReportsCharts />
          <FeatureModules />
          <DeviceSchedule />
          <TeachersActivities />
          <ProjectsCompetitions />
          <StudentCommunity />
          <TeachingAids />
        </main>

        <FloatingInfo />
      </div>
    </div>
  );
}
