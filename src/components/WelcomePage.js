"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faShieldAlt,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

export default function WelcomePage({ onStartSurvey }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/nsdc.png"
              alt="NSDC Logo"
              width={120}
              height={120}
              className="h-auto"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            NSDC 2025 Industrial Sugar Consumption Survey
          </h1>
          <p className="text-xl text-gray-600">
            National Sugar Development Council's Annual Survey for 2024
            Reporting Year
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Introduction Card */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <FontAwesomeIcon
                  icon={faChartLine}
                  className="text-blue-700 text-xl"
                />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Introduction
                </h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  Welcome to the National Sugar Development Council's (NSDC)
                  Annual Industrial Sugar Consumption Survey for the 2024
                  reporting year.
                </p>
                <p>
                  Your participation is crucial in helping Nigeria achieve
                  self-sufficiency in sugar production by providing accurate
                  insights into industrial sugar demand.
                </p>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    The data collected is vital for:
                  </h3>
                  <ul className="space-y-2 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      Improving our understanding of Nigeria's industrial market
                      size
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      Identifying key drivers, restraints, and opportunities
                      within the sugar sector
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      Tracking shifts in consumption, including the adoption of
                      sugar alternatives
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">•</span>
                      Providing reliable data for evidence-based policy
                      formulation and targeted government interventions
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Confidentiality Card */}
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <FontAwesomeIcon
                  icon={faShieldAlt}
                  className="text-green-600 text-xl"
                />
                <h2 className="text-2xl font-semibold text-gray-900">
                  Confidentiality
                </h2>
              </div>
              <div className="space-y-4 text-gray-700">
                <p>
                  We understand the sensitivity of your business data. All
                  individual company responses will be treated with the utmost
                  confidentiality and will only be used in aggregated,
                  anonymized form for statistical analysis and reporting.
                </p>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-medium text-blue-900">
                    Your specific data will not be disclosed to any third party.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions Card */}
          <div className="card mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Instructions
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Please complete this survey based on your company's operations
                for the calendar year:
                <span className="font-semibold">
                  {" "}
                  January 1, 2024 – December 31, 2024
                </span>
                , unless otherwise specified.
              </p>
              <p>
                Please provide data in{" "}
                <span className="font-semibold">Metric Tons (MT)</span> for
                volumes and{" "}
                <span className="font-semibold">Nigerian Naira (₦)</span> for
                values.
              </p>
            </div>
          </div>

          {/* Start Survey Button */}
          <div className="text-center mt-8">
            <button
              onClick={onStartSurvey}
              className="btn-primary text-lg px-8 py-4"
            >
              Start Survey
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <p className="text-gray-500 mt-4">
              Estimated completion time: 10-15 minutes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
