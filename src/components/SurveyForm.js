"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faPaperPlane,
  faSpinner,
  faCheckCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import QuestionRenderer from "./QuestionRenderer";

export default function SurveyForm({
  sections,
  currentSection,
  onSectionChange,
  onSectionComplete,
  onSubmit,
}) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const currentSectionData = sections.find((s) => s.id === currentSection);
  const currentSectionIndex = sections.findIndex(
    (s) => s.id === currentSection
  );
  const isLastSection = currentSectionIndex === sections.length - 1;
  const isFirstSection = currentSectionIndex === 0;

  const handleAnswerChange = (questionId, value) => {
    setFormData((prev) => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        [questionId]: value,
      },
    }));

    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }
  };

  const validateSection = () => {
    const newErrors = {};
    const sectionData = formData[currentSection] || {};

    currentSectionData.questions.forEach((question) => {
      // Check if the question should be required based on dependencies
      const shouldBeRequired = isQuestionRequired(question, sectionData);

      if (shouldBeRequired) {
        const value = sectionData[question.id];

        if (
          !value ||
          (typeof value === "string" && value.trim() === "") ||
          (Array.isArray(value) && value.length === 0)
        ) {
          newErrors[question.id] = "This field is required";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isSectionValid = () => {
    const sectionData = formData[currentSection] || {};

    return currentSectionData.questions.every((question) => {
      // Skip validation if question shouldn't be rendered
      if (!shouldRenderQuestion(question, sectionData)) return true;

      const shouldBeRequired = isQuestionRequired(question, sectionData);

      if (!shouldBeRequired) return true;

      const value = sectionData[question.id];
      return (
        value &&
        (typeof value !== "string" || value.trim() !== "") &&
        (!Array.isArray(value) || value.length > 0)
      );
    });
  };

  // Helper function to determine if a question should be rendered
  const shouldRenderQuestion = (question, sectionData) => {
    // Always render if no dependency
    if (!question.dependsOn) return true;

    const dependencyKey = Object.keys(question.dependsOn)[0];
    const dependencyValue = question.dependsOn[dependencyKey];

    // Check if the dependency is met in current section or across all form data
    const currentSectionValue = sectionData[dependencyKey];
    if (currentSectionValue === dependencyValue) return true;

    // Check across all sections for the dependency
    for (const [sectionId, data] of Object.entries(formData)) {
      const dependentValue = data[dependencyKey];
      if (typeof dependentValue === "object" && dependentValue?.value) {
        if (dependentValue.value === dependencyValue) return true;
      } else if (dependentValue === dependencyValue) {
        return true;
      }
    }

    return false;
  };

  // Helper function to determine if a question should be required
  const isQuestionRequired = (question, sectionData) => {
    // Always required questions
    if (question.required) return true;

    // Conditionally required questions
    if (question.conditionallyRequired && question.dependsOn) {
      const dependencyKey = Object.keys(question.dependsOn)[0];
      const dependencyValue = question.dependsOn[dependencyKey];

      // Check if the dependency is met in current section or across all form data
      const currentSectionValue = sectionData[dependencyKey];
      if (currentSectionValue === dependencyValue) return true;

      // Check across all sections for the dependency
      for (const [sectionId, data] of Object.entries(formData)) {
        if (data[dependencyKey] === dependencyValue) return true;
      }
    }

    return false;
  };

  const handleNext = () => {
    if (validateSection()) {
      onSectionComplete(currentSection);
      if (!isLastSection) {
        onSectionChange(sections[currentSectionIndex + 1].id);
      }
    }
  };

  const handlePrevious = () => {
    if (!isFirstSection) {
      onSectionChange(sections[currentSectionIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    if (!validateSection()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          surveyId: "nsdc-sugar-survey-2025",
          responses: formData,
          submittedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        onSubmit();
      } else {
        throw new Error("Failed to submit survey");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="card text-center">
        <FontAwesomeIcon
          icon={faCheckCircle}
          className="text-green-600 text-6xl mb-4"
        />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Survey Submitted Successfully!
        </h2>
        <p className="text-gray-600 mb-6">
          Thank you for participating in the NSDC 2025 Industrial Sugar
          Consumption Survey. Your responses will help shape Nigeria&apos;s
          sugar industry development.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-outline"
        >
          Submit Another Response
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:max-w-[] max-w-[90vw] ">
      {/* Section Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            {currentSectionData.title}
          </h2>
          <div className="text-xs sm:text-sm text-gray-500 whitespace-nowrap ml-4">
            Section {currentSectionIndex + 1} of {sections.length}
          </div>
        </div>
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentSectionIndex + 1) / sections.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="card space-y-6 sm:space-y-8">
        {currentSectionData.questions
          .filter((question) =>
            shouldRenderQuestion(question, formData[currentSection] || {})
          )
          .map((question) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              value={formData[currentSection]?.[question.id]}
              onChange={handleAnswerChange}
              error={errors[question.id]}
              isRequired={isQuestionRequired(
                question,
                formData[currentSection] || {}
              )}
            />
          ))}
      </div>

      {/* Navigation */}
      <div className="card">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={isFirstSection}
            className="btn-secondary flex-shrink-0"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </button>

          {submitStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600 text-center">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span className="text-xs sm:text-sm">
                Failed to submit. Please try again.
              </span>
            </div>
          )}

          {isLastSection ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isSectionValid()}
              className="btn-primary flex-shrink-0"
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  <span className="hidden sm:inline">Submitting...</span>
                  <span className="sm:hidden">Submitting</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Submit Survey</span>
                  <span className="sm:hidden">Submit</span>
                  <FontAwesomeIcon icon={faPaperPlane} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isSectionValid()}
              className="btn-primary flex-shrink-0"
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
