import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function POST(request) {
  try {
    const data = await request.json();
    const { surveyId, responses, submittedAt } = data;

    // Validate the data
    if (!surveyId || !responses || !submittedAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Google Sheets configuration
    const GOOGLE_SHEETS_CONFIG = {
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      sheetName: "Industrial Sugar Consumption Survey",
    };

    // Validate and clean the private key
    if (GOOGLE_SHEETS_CONFIG.privateKey) {
      // Ensure the private key has proper formatting
      let cleanKey = GOOGLE_SHEETS_CONFIG.privateKey.trim();
      if (!cleanKey.startsWith("-----BEGIN")) {
        cleanKey = `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
      }
      GOOGLE_SHEETS_CONFIG.privateKey = cleanKey;
    }

    // Check if Google Sheets is configured
    if (
      !GOOGLE_SHEETS_CONFIG.spreadsheetId ||
      !GOOGLE_SHEETS_CONFIG.serviceAccountEmail ||
      !GOOGLE_SHEETS_CONFIG.privateKey
    ) {
      console.log("Google Sheets not configured, using fallback method");
      return await handleFallbackSubmission(data);
    }

    // Flatten the response data for Google Sheets
    const flattenedData = flattenSurveyData(responses, submittedAt);

    // Submit to Google Sheets
    await submitToGoogleSheets(flattenedData, GOOGLE_SHEETS_CONFIG);

    // Log successful submission
    console.log("Survey submission successful:", {
      surveyId,
      submittedAt,
      responseCount: Object.keys(responses).length,
    });

    return NextResponse.json({
      success: true,
      message: "Survey submitted successfully",
      submissionId: generateSubmissionId(),
    });
  } catch (error) {
    console.error("Survey submission error:", error);
    return NextResponse.json(
      { error: "Failed to submit survey" },
      { status: 500 }
    );
  }
}

// Google Sheets API implementation
async function submitToGoogleSheets(data, config) {
  try {
    // Create Google Auth client with improved error handling
    let auth;
    try {
      // Try using service account JSON if available
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const serviceAccount = JSON.parse(
          process.env.GOOGLE_SERVICE_ACCOUNT_JSON
        );
        auth = new google.auth.GoogleAuth({
          credentials: serviceAccount,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
      } else {
        // Fallback to individual environment variables
        auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: config.serviceAccountEmail,
            private_key: config.privateKey,
          },
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        });
      }
    } catch (authError) {
      console.error("Google Auth creation failed:", authError);
      throw new Error(
        `Authentication failed: ${authError.message}. This might be due to an incompatible private key format. Please regenerate your Google service account key.`
      );
    }

    const sheets = google.sheets({ version: "v4", auth });

    // Get existing headers
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${config.sheetName}!1:1`,
    });

    const existingHeaders = headerResponse.data.values?.[0] || [];
    const newHeaders = Object.keys(data);

    // Define preferred column order for better organization
    const preferredOrder = [
      "Submission Date",
      "Submission Time",
      "Submission ID",
      "Company Name",
      "Primary Industry",
      "Primary Location (State)",
      "Annual Revenue",
      "Number of Employees",
      "Primary Procurement Method",

      // Historical data (chronological order: 2024, 2023, 2022)
      "2024 Historical Volume (MT)",
      "2024 Historical Cost (₦ Million)",
      "2023 Historical Volume (MT)",
      "2023 Historical Cost (₦ Million)",
      "2022 Historical Volume (MT)",
      "2022 Historical Cost (₦ Million)",

      // Sugar type consumption (each type as separate column)
      "White Sugar (MT)",
      "Brown Sugar (MT)",
      "Liquid Sugar (MT)",
      "Other (MT)",

      // Product breakdown
      "Product Breakdown",

      // Raw material and origin breakdown
      "Raw Material - Sugarcane (%)",
      "Raw Material - Sugar Beet (%)",
      "Raw Material - Dont Know (%)",
      "Origin - Domestic (MT)",
      "Origin - Imported (MT)",

      // Sugar alternatives
      "Uses Sugar Alternatives",
      "Alternative Types",
      "Alternative Reasons",
      "2024 Alternative Volume (MT)",
      "2023 Alternative Volume (MT)",
      "2022 Alternative Volume (MT)",
      "Future Alternative Intentions",

      // Impact factors (consistent pattern without prefix)
      "Exchange Rate Fluctuations",
      "Overall Economic Growth",
      "Demand for Low Calorie Products",
      "Demand for Natural Ingredients",
      "Import Tariffs/Levies",
      "Labelling Requirements",
      "Availability of Sugar in Nigerian Market",
      "Logistical Challenges",

      // Future forecasts (chronological order: 2025, 2026, 2027)
      "2025 Forecast (MT)",
      "2026 Forecast (MT)",
      "2027 Forecast (MT)",
      "Alternatives Future Change",
      "Planned Product Launches",
      "Biggest Challenge",
      "Biggest Opportunity",
      "Top Measures",

      // Survey feedback
      "Survey Difficulty",
      "Survey Improvements",
    ];

    // Organize headers: preferred order first, then any additional ones
    const organizedHeaders = [
      ...preferredOrder.filter((header) => newHeaders.includes(header)),
      ...newHeaders.filter((header) => !preferredOrder.includes(header)),
    ];

    // Combine with existing headers, maintaining order
    const allHeaders =
      existingHeaders.length > 0
        ? [...new Set([...existingHeaders, ...newHeaders])]
        : organizedHeaders;

    // Update headers if new ones were added or if this is the first submission
    if (
      allHeaders.length > existingHeaders.length ||
      existingHeaders.length === 0
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: config.spreadsheetId,
        range: `${config.sheetName}!1:1`,
        valueInputOption: "RAW",
        requestBody: {
          values: [allHeaders],
        },
      });

      // Apply formatting to headers if this is the first row
      if (existingHeaders.length === 0) {
        await formatHeaderRow(
          sheets,
          config.spreadsheetId,
          config.sheetName,
          allHeaders.length
        );
      }
    }

    // Prepare row data in the same order as headers
    const rowData = allHeaders.map((header) => data[header] || "");

    // Append the data
    await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: config.sheetName,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [rowData],
      },
    });

    console.log(
      "Successfully submitted to Google Sheets with improved formatting"
    );
  } catch (error) {
    console.error("Google Sheets submission error:", error);
    throw new Error(`Failed to submit to Google Sheets: ${error.message}`);
  }
}

// Helper function to format the header row
async function formatHeaderRow(sheets, spreadsheetId, sheetName, columnCount) {
  try {
    // Get sheet ID
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });

    const sheet = sheetInfo.data.sheets?.find(
      (s) => s.properties.title === sheetName
    );
    if (!sheet) return;

    const sheetId = sheet.properties.sheetId;

    // Apply basic formatting to header row (no colors, just bold and auto-resize)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: sheetId,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: columnCount,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    fontSize: 11,
                    bold: true,
                  },
                },
              },
              fields: "userEnteredFormat(textFormat)",
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: sheetId,
                dimension: "COLUMNS",
                startIndex: 0,
                endIndex: columnCount,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.log("Could not format header row:", error.message);
    // Don't throw error - formatting is optional
  }
}

// Fallback submission method (logs to console/file)
async function handleFallbackSubmission(data) {
  console.log("=== SURVEY SUBMISSION (Fallback Method) ===");
  console.log("Survey ID:", data.surveyId);
  console.log("Submitted At:", data.submittedAt);

  // Show flattened data structure for preview
  const flattenedData = flattenSurveyData(data.responses, data.submittedAt);
  console.log("\n=== FORMATTED DATA PREVIEW ===");
  Object.entries(flattenedData).forEach(([key, value]) => {
    console.log(`${key}: ${value}`);
  });

  console.log("\n=== RAW RESPONSES ===");
  console.log(JSON.stringify(data.responses, null, 2));
  console.log("=== END SUBMISSION ===");

  return NextResponse.json({
    success: true,
    message: "Survey submitted successfully (fallback method)",
    submissionId: generateSubmissionId(),
    note: "Data logged to console with improved formatting. Configure Google Sheets API for automatic spreadsheet submission.",
    preview: flattenedData, // Include formatted preview in response
  });
}

// Helper function to flatten nested survey data for spreadsheet format
function flattenSurveyData(responses, submittedAt) {
  const flattened = {
    "Submission Date": new Date(submittedAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    "Submission Time": new Date(submittedAt).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    "Submission ID": generateSubmissionId(),
  };

  // Question ID to human-readable label mapping
  const questionLabels = {
    // Section 1 - Company Profile
    companyName: "Company Name",
    primaryIndustry: "Primary Industry",
    primaryLocation: "Primary Location (State)",
    annualRevenue: "Annual Revenue",
    employees: "Number of Employees",
    procurementMethod: "Primary Procurement Method",

    // Section 6 - Survey Feedback
    surveyDifficulty: "Survey Difficulty",
    surveyImprovements: "Survey Improvements",

    // Section 4 - Impact Factors
    impactFactors: "Impact Factors",

    // Section 3 - Sugar Alternatives
    usesSugarAlternatives: "Uses Sugar Alternatives",
    alternativeTypes: "Alternative Types",
    alternativeReasons: "Alternative Reasons",
    futureAlternativeIntentions: "Future Alternative Intentions",

    // Section 5 - Future Outlook
    alternativesFutureChange: "Alternatives Future Change",
    plannedProductLaunches: "Planned Product Launches",
    biggestChallenge: "Biggest Challenge",
    biggestOpportunity: "Biggest Opportunity",
    topMeasures: "Top Measures",
  };

  // Flatten each section's responses with improved formatting
  Object.entries(responses).forEach(([sectionId, sectionData]) => {
    Object.entries(sectionData || {}).forEach(([questionId, answer]) => {
      // Handle special cases with custom formatting
      if (questionId === "historicalConsumption" && Array.isArray(answer)) {
        // Each year gets its own columns for volume and cost
        answer.forEach((row) => {
          if (row.year) {
            flattened[`${row.year} Historical Volume (MT)`] = row.volume || "";
            flattened[`${row.year} Historical Cost (₦ Million)`] =
              row.cost || "";
          }
        });
        return;
      }

      if (questionId === "sugarTypeConsumption" && Array.isArray(answer)) {
        // Each sugar type gets its own column
        answer.forEach((row) => {
          if (row.sugarType) {
            const sugarType = row.sugarType;
            const totalVolume = (
              parseFloat(row.granulated || 0) +
              parseFloat(row.powdered || 0) +
              parseFloat(row.syrup || 0) +
              parseFloat(row.other || 0)
            ).toString();
            flattened[`${sugarType} (MT)`] = totalVolume;
          }
        });
        return;
      }

      if (questionId === "alternativesVolume" && Array.isArray(answer)) {
        // Alternative volumes with year prefixes: 2024volume, 2023volume, 2022volume
        answer.forEach((row) => {
          if (row.year) {
            flattened[`${row.year} Alternative Volume (MT)`] = row.volume || "";
          }
        });
        return;
      }

      if (questionId === "consumptionForecast" && Array.isArray(answer)) {
        // Forecast with year prefixes: 2025forecast, 2026forecast, 2027forecast
        answer.forEach((row) => {
          if (row.year) {
            flattened[`${row.year} Forecast (MT)`] = row.forecast || "";
          }
        });
        return;
      }

      if (questionId === "endProductBreakdown" && Array.isArray(answer)) {
        // Product breakdown with curly braces format
        const formattedBreakdown = answer
          .map((item) => {
            return `{Category: ${item.productCategory}, Volume: ${item.volume}}`;
          })
          .join(" | ");
        flattened["Product Breakdown"] = formattedBreakdown || "";
        return;
      }

      if (
        questionId === "impactFactors" &&
        typeof answer === "object" &&
        !Array.isArray(answer)
      ) {
        // Handle rating factors with consistent pattern (without "Labelling" prefix)
        Object.entries(answer).forEach(([factorKey, rating]) => {
          const formattedFactorKey = formatFactorKey(factorKey);
          flattened[formattedFactorKey] = rating || "";
        });
        return;
      }

      if (
        questionId === "rawMaterialSource" &&
        typeof answer === "object" &&
        !Array.isArray(answer)
      ) {
        // Handle raw material source percentages
        Object.entries(answer).forEach(([sourceKey, percentage]) => {
          const formattedSourceKey = formatQuestionId(sourceKey);
          flattened[`Raw Material - ${formattedSourceKey} (%)`] =
            percentage || "";
        });
        return;
      }

      if (
        questionId === "originBreakdown" &&
        typeof answer === "object" &&
        !Array.isArray(answer)
      ) {
        // Handle origin breakdown
        Object.entries(answer).forEach(([originKey, volume]) => {
          const formattedOriginKey = formatQuestionId(originKey);
          flattened[`Origin - ${formattedOriginKey} (MT)`] = volume || "";
        });
        return;
      }

      // Use human-readable label for standard questions
      const columnName =
        questionLabels[questionId] || formatQuestionId(questionId);

      if (answer === null || answer === undefined) {
        flattened[columnName] = "";
      } else if (typeof answer === "object") {
        if (Array.isArray(answer)) {
          // Handle arrays (checkboxes, tables, repeatable fields)
          if (answer.length === 0) {
            flattened[columnName] = "None selected";
          } else {
            // Format arrays as comma-separated values for better readability
            flattened[columnName] = answer
              .map((item) => {
                if (typeof item === "object") {
                  return Object.entries(item)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("; ");
                }
                return item;
              })
              .join(", ");
          }
        } else {
          // Handle objects (radio with text fields, ratings, groups)
          if (answer.value !== undefined) {
            // Radio button with possible text field
            let result = answer.value;
            if (answer.text && answer.text.trim()) {
              result += ` (${answer.text.trim()})`;
            }
            flattened[columnName] = result;
          } else {
            // Other objects - format as key-value pairs
            flattened[columnName] = Object.entries(answer)
              .filter(([k, v]) => v !== null && v !== undefined && v !== "")
              .map(([k, v]) => `${formatQuestionId(k)}: ${v}`)
              .join("; ");
          }
        }
      } else {
        flattened[columnName] = String(answer);
      }
    });
  });

  return flattened;
}

// Helper function to convert camelCase/snake_case to readable format
function formatQuestionId(id) {
  return id
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/_/g, " ") // Replace underscores with spaces
    .replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize first letter of each word
    .trim();
}

// Helper function to format factor keys for consistent rating labelling
function formatFactorKey(key) {
  const keyMappings = {
    "exchange-rate": "Exchange Rate Fluctuations",
    "economic-growth": "Overall Economic Growth",
    "low-calorie-demand": "Demand for Low Calorie Products",
    "natural-ingredients": "Demand for Natural Ingredients",
    "import-tariffs": "Import Tariffs/Levies",
    "labelling-requirements": "Labelling Requirements",
    "sugar-availability": "Availability of Sugar in Nigerian Market",
    "logistical-challenges": "Logistical Challenges",
  };

  return keyMappings[key] || formatQuestionId(key);
}

function generateSubmissionId() {
  return `nsdc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Example environment variables needed (.env.local):
/*
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
*/
