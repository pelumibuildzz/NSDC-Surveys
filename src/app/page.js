"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import WelcomePage from "../components/WelcomePage";
import SurveyForm from "../components/SurveyForm";
import SectionNavigation from "../components/SectionNavigation";
import surveyData from "../data/sugar-survey-questions.json";

export default function Home() {
  const [currentView, setCurrentView] = useState("welcome"); // 'welcome' | 'survey'
  const [currentSection, setCurrentSection] = useState("section1");
  const [completedSections, setCompletedSections] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const handleStartSurvey = () => {
    setCurrentView("survey");
  };

  const handleSectionChange = (sectionId) => {
    setCurrentSection(sectionId);
  };

  const handleSectionComplete = (sectionId) => {
    if (!completedSections.includes(sectionId)) {
      setCompletedSections((prev) => [...prev, sectionId]);
    }
  };

  const handleSurveySubmit = () => {
    // Could redirect to a thank you page or reset the form
    console.log("Survey submitted successfully");
  };

  if (currentView === "welcome") {
    return <WelcomePage onStartSurvey={handleStartSurvey} />;
  }

  return (
    <div
      className={
        isMobile ? "min-h-screen bg-gray-50 mb-10" : "min-h-screen bg-gray-50"
      }
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/nsdc.png"
                alt="NSDC Logo"
                width={50}
                height={50}
                className="h-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  NSDC Survey 2025
                </h1>
                <p className="text-sm text-gray-600">
                  Industrial Sugar Consumption
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView("welcome")}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Back to Welcome
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="lg:col-span-1">
              <SectionNavigation
                sections={surveyData.survey.sections}
                currentSection={currentSection}
                onSectionChange={handleSectionChange}
                completedSections={completedSections}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="lg:col-span-3">
            <SurveyForm
              sections={surveyData.survey.sections}
              currentSection={currentSection}
              onSectionChange={handleSectionChange}
              completedSections={completedSections}
              onSectionComplete={handleSectionComplete}
              onSubmit={handleSurveySubmit}
            />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <SectionNavigation
            sections={surveyData.survey.sections}
            currentSection={currentSection}
            onSectionChange={handleSectionChange}
            completedSections={completedSections}
            isMobile={true}
          />
        </div>
      )}
    </div>
  );
}
