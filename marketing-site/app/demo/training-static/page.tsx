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
import StudentsPage from "./sections/students";
import LeadsPage from "./sections/leads";
import CompetitionsPage from "./sections/competitions";
import ResourcesPage from "./sections/resources";
import ProjectsPage from "./sections/projects";
import BillingPage from "./sections/billing";
import MarketingPage from "./sections/marketing";
import TeacherPerformance from "./sections/teacher-performance";
import ParentPortal from "./sections/parent-portal";
import MultiCampus from "./sections/multi-campus";
import NotificationsPage from "./sections/notifications";

function renderSection(menuId: string) {
  switch (menuId) {
    case "dashboard":
      return (
        <>
          <DashboardKpi />
          <RevenueTokens />
          <FeatureActions />
          <TeachersActivities />
        </>
      );
    case "students":
      return <StudentsPage />;
    case "leads":
      return <LeadsPage />;
    case "schedule":
    case "devices":
      return <DeviceSchedule />;
    case "projects":
      return <ProjectsPage />;
    case "resources":
      return <ResourcesPage />;
    case "competitions":
      return <CompetitionsPage />;
    case "tokens":
      return <RevenueTokens />;
    case "marketing":
      return <MarketingPage />;
    case "billing":
      return <BillingPage />;
    case "teachers":
      return <TeacherPerformance />;
    case "parents":
      return <ParentPortal />;
    case "campus":
      return <MultiCampus />;
    case "notifications":
      return <NotificationsPage />;
    case "reports":
      return <DashboardKpi />;
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
