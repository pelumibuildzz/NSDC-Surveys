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
      if (question.required) {
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
      if (!question.required) return true;

      const value = sectionData[question.id];
      return (
        value &&
        (typeof value !== "string" || value.trim() !== "") &&
        (!Array.isArray(value) || value.length > 0)
      );
    });
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
    <div className="space-y-6">
      {/* Section Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {currentSectionData.title}
          </h2>
          <div className="text-sm text-gray-500">
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
      <div className="card space-y-8">
        {currentSectionData.questions.map((question) => (
          <QuestionRenderer
            key={question.id}
            question={question}
            value={formData[currentSection]?.[question.id]}
            onChange={handleAnswerChange}
            error={errors[question.id]}
          />
        ))}
      </div>

      {/* Navigation */}
      <div className="card">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstSection}
            className="btn-secondary"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
            Previous
          </button>

          {submitStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <span className="text-sm">
                Failed to submit. Please try again.
              </span>
            </div>
          )}

          {isLastSection ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isSectionValid()}
              className="btn-primary"
            >
              {isSubmitting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Survey
                  <FontAwesomeIcon icon={faPaperPlane} />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isSectionValid()}
              className="btn-primary"
            >
              Next
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
