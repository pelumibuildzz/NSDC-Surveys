import { NextResponse } from "next/server";
import { google } from "googleapis";

// Verify admin password
function verifyAdminPassword(password) {
  return password === process.env.ADMIN_PASS;
}

export async function POST(request) {
  try {
    const { password } = await request.json();

    // Verify admin password
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    // Google Sheets configuration
    const GOOGLE_SHEETS_CONFIG = {
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      sheetName: "Industrial Sugar Consumption Survey",
    };

    // Validate Google Sheets configuration
    if (
      !GOOGLE_SHEETS_CONFIG.spreadsheetId ||
      !GOOGLE_SHEETS_CONFIG.serviceAccountEmail ||
      !GOOGLE_SHEETS_CONFIG.privateKey
    ) {
      return NextResponse.json(
        { error: "Google Sheets configuration incomplete" },
        { status: 500 }
      );
    }

    // Fetch data from Google Sheets
    const data = await fetchDataFromGoogleSheets(GOOGLE_SHEETS_CONFIG);

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

async function fetchDataFromGoogleSheets(config) {
  try {
    // Create Google Auth client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.serviceAccountEmail,
        private_key: config.privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    // Get the data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `${config.sheetName}!A1:ZZ1000`, // Get all data
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return [];
    }

    // First row contains headers
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // Convert to objects
    const data = dataRows.map((row) => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });

    return data;
  } catch (error) {
    console.error("Error fetching data from Google Sheets:", error);
    throw error;
  }
}
