"use client";

import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setDashboardData(data.data);
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (err) {
      setError("Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data) => {
    if (!data || data.length === 0) return null;

    // Debug: Log first row to understand data structure
    console.log("Sample data row:", data[0]);
    console.log("Sugar type data:", {
      whiteSugar: data[0]?.["White Sugar (MT)"],
      brownSugar: data[0]?.["Brown Sugar (MT)"],
      liquidSugar: data[0]?.["Liquid Sugar (MT)"],
      other: data[0]?.["Other (MT)"],
    });

    // Process data for different chart types
    const processed = {
      sugarConsumption: processSugarConsumptionData(data),
      sugarTypeBreakdown: processSugarTypeData(data),
      rawMaterialSources: processRawMaterialData(data),
      impactFactors: processImpactFactorsData(data),
      forecasts: processForecastData(data),
      domesticVsImported: processDomesticImportedData(data),
      alternativeSweeteners: processAlternativeSweetenersData(data),
    };

    console.log("Processed sugar type data:", processed.sugarTypeBreakdown);
    return processed;
  };

  const processSugarConsumptionData = (data) => {
    // Extract historical consumption data (2022, 2023, 2024)
    const years = ["2022", "2023", "2024"];
    const consumptionData = years.map((year) => {
      const total = data.reduce((sum, row) => {
        const consumption = parseFloat(
          row[`${year} Historical Volume (MT)`] || 0
        );
        return sum + consumption;
      }, 0);
      return total;
    });

    return {
      labels: years,
      datasets: [
        {
          label: "Sugar Consumption (MT)",
          data: consumptionData,
          borderColor: "rgb(75, 192, 192)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.1,
        },
      ],
    };
  };

  const processAlternativeSweetenersData = (data) => {
    const years = ["2022", "2023", "2024"];

    // Calculate total alternative volume by year
    const alternativeData = years.map((year) => {
      const total = data.reduce((sum, row) => {
        const volume = parseFloat(row[`${year} Alternative Volume (MT)`] || 0);
        return sum + volume;
      }, 0);
      return total;
    });

    return {
      labels: years,
      datasets: [
        {
          label: "Alternative Sweeteners Volume (MT)",
          data: alternativeData,
          borderColor: "rgb(168, 85, 247)",
          backgroundColor: "rgba(168, 85, 247, 0.2)",
          tension: 0.1,
        },
      ],
    };
  };

  const processSugarTypeData = (data) => {
    const sugarTypes = [
      "White Sugar (MT)",
      "Brown Sugar (MT)",
      "Liquid Sugar (MT)",
      "Other (MT)",
    ];
    const typeLabels = ["White Sugar", "Brown Sugar", "Liquid Sugar", "Other"];

    const typeData = sugarTypes.map((type) => {
      return data.reduce((sum, row) => {
        const value = row[type];
        let amount = 0;

        if (value && typeof value === "string") {
          try {
            // Try to parse JSON-like strings
            if (value.startsWith("{") && value.endsWith("}")) {
              // Parse object-like strings: {granulated: 3, syrup: 32}
              const cleanValue = value.replace(/[{}]/g, "").trim();
              if (cleanValue) {
                const pairs = cleanValue.split(",");
                pairs.forEach((pair) => {
                  const [key, val] = pair.split(":").map((s) => s.trim());
                  const numVal = parseFloat(val);
                  if (!isNaN(numVal)) {
                    amount += numVal;
                  }
                });
              }
            } else {
              // Try to parse as simple number
              amount = parseFloat(value) || 0;
            }
          } catch (e) {
            // If parsing fails, try to extract numbers
            const numbers = value.match(/\d+\.?\d*/g);
            if (numbers) {
              amount = numbers.reduce((acc, num) => acc + parseFloat(num), 0);
            }
          }
        } else if (typeof value === "number") {
          amount = value;
        }

        return sum + amount;
      }, 0);
    });

    return {
      labels: typeLabels,
      datasets: [
        {
          data: typeData,
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)",
            "rgba(54, 162, 235, 0.8)",
            "rgba(255, 205, 86, 0.8)",
            "rgba(75, 192, 192, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 205, 86, 1)",
            "rgba(75, 192, 192, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  const processRawMaterialData = (data) => {
    // Group by company and raw material source
    const companies = [
      ...new Set(data.map((row) => row["Company Name"] || "Unknown")),
    ];
    const sources = [
      "Raw Material - Sugarcane (%)",
      "Raw Material - Sugar Beet (%)",
      "Raw Material - Dont Know (%)",
    ];
    const sourceLabels = ["Sugarcane", "Sugar Beet", "Don't Know"];

    const datasets = sources.map((source, index) => {
      const colors = [
        "rgba(34, 197, 94, 0.8)",
        "rgba(168, 85, 247, 0.8)",
        "rgba(156, 163, 175, 0.8)",
      ];

      const companyData = companies.map((company) => {
        const companyRows = data.filter(
          (row) => (row["Company Name"] || "Unknown") === company
        );

        if (companyRows.length === 0) return 0;

        const avgPercentage =
          companyRows.reduce((sum, row) => {
            const pct = parseFloat(row[source] || 0);
            return sum + pct;
          }, 0) / companyRows.length;

        return avgPercentage;
      });

      return {
        label: sourceLabels[index],
        data: companyData,
        backgroundColor: colors[index],
        borderColor: colors[index],
        borderWidth: 1,
      };
    });

    return {
      labels: companies.slice(0, 10), // Limit to first 10 companies
      datasets,
    };
  };

  const processDomesticImportedData = (data) => {
    const domesticTotal = data.reduce((sum, row) => {
      const amount = parseFloat(row["Origin - Domestic (MT)"] || 0);
      return sum + amount;
    }, 0);

    const importedTotal = data.reduce((sum, row) => {
      const amount = parseFloat(row["Origin - Imported (MT)"] || 0);
      return sum + amount;
    }, 0);

    return {
      labels: ["Domestic", "Imported"],
      datasets: [
        {
          label: "Sugar Volume (MT)",
          data: [domesticTotal, importedTotal],
          backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(239, 68, 68, 0.8)"],
          borderColor: ["rgba(34, 197, 94, 1)", "rgba(239, 68, 68, 1)"],
          borderWidth: 1,
        },
      ],
    };
  };

  const processImpactFactorsData = (data) => {
    const companies = [
      ...new Set(data.map((row) => row["Company Name"] || "Unknown")),
    ];
    const factors = [
      "Exchange Rate Fluctuations",
      "Overall Economic Growth",
      "Demand for Low Calorie Products",
      "Demand for Natural Ingredients",
      "Import Tariffs/Levies",
      "Labelling Requirements",
      "Availability of Sugar in Nigerian Market",
      "Logistical Challenges",
    ];

    const datasets = factors.map((factor, index) => {
      const colors = [
        "rgba(239, 68, 68, 0.8)",
        "rgba(249, 115, 22, 0.8)",
        "rgba(245, 158, 11, 0.8)",
        "rgba(34, 197, 94, 0.8)",
        "rgba(59, 130, 246, 0.8)",
        "rgba(147, 51, 234, 0.8)",
        "rgba(236, 72, 153, 0.8)",
        "rgba(156, 163, 175, 0.8)",
      ];

      const companyData = companies.map((company) => {
        const companyRows = data.filter(
          (row) => (row["Company Name"] || "Unknown") === company
        );

        if (companyRows.length === 0) return 0;

        // Impact factor rating (1-5 scale) - get average for company
        const avgRating =
          companyRows.reduce((sum, row) => {
            const impact = parseFloat(row[factor] || 0);
            return sum + impact;
          }, 0) / companyRows.length;

        return avgRating;
      });

      return {
        label: factor,
        data: companyData,
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length],
        borderWidth: 1,
      };
    });

    return {
      labels: companies.slice(0, 8), // Limit to first 8 companies
      datasets,
    };
  };

  const processForecastData = (data) => {
    const forecastYears = ["2025", "2026", "2027"];
    const forecastData = forecastYears.map((year) => {
      const total = data.reduce((sum, row) => {
        const forecast = parseFloat(row[`${year} Forecast (MT)`] || 0);
        return sum + forecast;
      }, 0);
      return total;
    });

    return {
      labels: forecastYears,
      datasets: [
        {
          label: "Forecasted Sugar Consumption (MT)",
          data: forecastData,
          borderColor: "rgb(168, 85, 247)",
          backgroundColor: "rgba(168, 85, 247, 0.2)",
          borderDash: [5, 5],
          tension: 0.1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
    },
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">NSDC Dashboard</h1>
            <p className="text-gray-600 mt-2">Admin Access Required</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const chartData = dashboardData ? processChartData(dashboardData) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              NSDC Sugar Industry Dashboard
            </h1>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setDashboardData(null);
                setPassword("");
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!chartData ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading dashboard data...</div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Sugar Consumption Trends */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Sugar Consumption Trends (2022-2024)
              </h2>
              <div className="h-64">
                {chartData.sugarConsumption && (
                  <Line
                    data={chartData.sugarConsumption}
                    options={chartOptions}
                  />
                )}
              </div>
            </section>

            {/* Alternative Sweeteners */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Alternative Sweetener Volumes by Year
              </h2>
              <div className="h-64">
                {chartData.alternativeSweeteners && (
                  <Line
                    data={chartData.alternativeSweeteners}
                    options={chartOptions}
                  />
                )}
              </div>
            </section>

            {/* Sugar Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Sugar Type Consumption Breakdown
                </h2>
                <div className="h-64">
                  {chartData.sugarTypeBreakdown && (
                    <Pie
                      data={chartData.sugarTypeBreakdown}
                      options={pieOptions}
                    />
                  )}
                </div>
              </section>

              {/* Domestic vs Imported */}
              <section className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Domestic vs Imported Sugar Volumes
                </h2>
                <div className="h-64">
                  {chartData.domesticVsImported && (
                    <Bar
                      data={chartData.domesticVsImported}
                      options={chartOptions}
                    />
                  )}
                </div>
              </section>
            </div>

            {/* Raw Material Sources */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Raw Material Source Percentages by Company
              </h2>
              <div className="h-80">
                {chartData.rawMaterialSources && (
                  <Bar
                    data={chartData.rawMaterialSources}
                    options={{
                      ...chartOptions,
                      scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true, max: 100 },
                      },
                    }}
                  />
                )}
              </div>
            </section>

            {/* Impact Factors */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Impact Factors by Company (Rating Scale 1-5)
              </h2>
              <div className="h-80">
                {chartData.impactFactors && (
                  <Bar
                    data={chartData.impactFactors}
                    options={{
                      ...chartOptions,
                      scales: {
                        y: { beginAtZero: true, max: 5 },
                      },
                    }}
                  />
                )}
              </div>
            </section>

            {/* Forecasts */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Forecasted Sugar Consumption (2025-2027)
              </h2>
              <div className="h-64">
                {chartData.forecasts && (
                  <Line data={chartData.forecasts} options={chartOptions} />
                )}
              </div>
            </section>

            {/* Data Summary */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Data Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {dashboardData?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Responses</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {[
                      ...new Set(
                        dashboardData?.map((row) => row["Company Name"])
                      ),
                    ]?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Unique Companies</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">Last Updated</div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
