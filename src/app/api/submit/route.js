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
    // Create Google Auth client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.serviceAccountEmail,
        private_key: config.privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

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
      "Years in Operation",
      "Number of Employees",
      "Annual Turnover Range",
      "Quality Certifications",
      "Export Activities",
      "2024 Total Sugar Consumption (MT)",
      "2024 Sugar Sources",
      "2024 Domestic Sugar (Percentage)",
      "2024 Imported Sugar (Percentage)",
      "2024 Sugar Types Used",
      "2024 Raw Material Source (Percentage)",
      "2024 Sugar Consumption Volume (MT)",
      "2024 Average Monthly Consumption (MT)",
      "2024 Peak Consumption Months",
      "2024 Price Range (₦/MT)",
      "2024 Quality Standards",
      "2024 Storage Capacity (MT)",
      "2024 Seasonal Variation",
      "2024 Procurement Challenges",
      "2024 Quality Requirements",
      "2024 Market Trends",
      "2024 Price Volatility Impact",
      "2024 Competitive Position",
      "2024 Market Share (Percentage)",
      "2024 Customer Base",
      "2024 Distribution Channels",
      "2024 Growth Rate (Percentage)",
      "2023 Volume (MT)",
      "2024 Volume (MT)",
      "2025 Future Projections",
      "2025 Forecast (MT)",
      "2025 Expected Growth (Percentage)",
      "2025 Anticipated Challenges",
      "2025 Investment Plans",
      "2025 Capacity Expansion (Percentage)",
      "2025 Projection (Percentage)",
      "2025 Targets",
      "2025 Plans",
      "2025 Budget (₦)",
      "2025 Capacity (MT)",
      "2025 Recommendations for NSDC",
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
    operationalYears: "Years in Operation",
    employeeCount: "Number of Employees",
    annualTurnover: "Annual Turnover Range",
    certifications: "Quality Certifications",
    exportActivities: "Export Activities",

    // Section 2 - Sugar Consumption (2024 data)
    totalSugarConsumption: "2024 Total Sugar Consumption (MT)",
    sugarSources: "2024 Sugar Sources",
    domesticSugarPercentage: "2024 Domestic Sugar (Percentage)",
    importedSugarPercentage: "2024 Imported Sugar (Percentage)",
    sugarTypes: "2024 Sugar Types Used",
    seasonalVariation: "2024 Seasonal Variation",
    procurementChallenges: "2024 Procurement Challenges",
    qualityRequirements: "2024 Quality Requirements",
    rawMaterialSource: "2024 Raw Material Source (Percentage)",
    sugarConsumptionVolume: "2024 Sugar Consumption Volume (MT)",
    averageMonthlyConsumption: "2024 Average Monthly Consumption (MT)",
    peakConsumptionMonths: "2024 Peak Consumption Months",
    priceRange: "2024 Price Range (₦/MT)",
    qualityStandards: "2024 Quality Standards",
    storageCapacity: "2024 Storage Capacity (MT)",

    // Section 3 - Market Analysis & Projections
    marketTrends: "2024 Market Trends",
    priceVolatility: "2024 Price Volatility Impact",
    competitivePosition: "2024 Competitive Position",
    futureProjections: "2025 Future Projections",
    recommendationsForNSDC: "2025 Recommendations for NSDC",
    expectedGrowth: "2025 Expected Growth (Percentage)",
    anticipatedChallenges: "2025 Anticipated Challenges",
    investmentPlans: "2025 Investment Plans",
    capacityExpansion: "2025 Capacity Expansion (Percentage)",
    marketShare: "2024 Market Share (Percentage)",
    customerBase: "2024 Customer Base",
    distributionChannels: "2024 Distribution Channels",

    // Additional time-specific fields
    volume2023: "2023 Volume (MT)",
    volume2024: "2024 Volume (MT)",
    forecast2025: "2025 Forecast (MT)",
    growth2024: "2024 Growth Rate (Percentage)",
    projection2025: "2025 Projection (Percentage)",
    targets2025: "2025 Targets",
    plans2025: "2025 Plans",
    budget2025: "2025 Budget (₦)",
    capacity2025: "2025 Capacity (MT)",
  };

  // Flatten each section's responses with better formatting
  Object.entries(responses).forEach(([sectionId, sectionData]) => {
    Object.entries(sectionData || {}).forEach(([questionId, answer]) => {
      // Use human-readable label instead of technical ID
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

function generateSubmissionId() {
  return `nsdc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Example environment variables needed (.env.local):
/*
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
*/
