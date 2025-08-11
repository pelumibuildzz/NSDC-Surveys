# NSDC Sugar Consumption Survey Form

A modern, responsive web application for collecting industrial sugar consumption data for the National Sugar Development Council (NSDC) of Nigeria.

## Features

- **Modern Design**: Clean, professional UI with responsive design
- **Multi-Section Form**: 6 sections covering comprehensive sugar consumption data
- **Progressive Navigation**: Section-based navigation with progress tracking
- **Google Sheets Integration**: Automatic data submission to Google Sheets
- **Mobile Responsive**: Optimized for desktop, tablet, and mobile devices
- **Real-time Validation**: Client-side form validation with error handling
- **Accessibility**: Screen reader friendly with proper ARIA labels

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Icons**: Font Awesome
- **API**: Google Sheets API
- **Styling**: Custom CSS theme with Tailwind utilities

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Google Cloud Platform account (for Google Sheets API)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nsdc-form
```

2. Install dependencies:
```bash
npm install
```

3. Set up Google Sheets API (see [Google Sheets Setup](#google-sheets-setup) below)

4. Create environment variables:
```bash
cp .env.local.example .env.local
```

5. Edit `.env.local` with your Google Sheets API credentials

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Google Sheets Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Sheets API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### Step 2: Create Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### Step 3: Generate API Key

1. Click on the created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Download the JSON file

### Step 4: Share Google Sheet

1. Create a new Google Sheet or use an existing one
2. Click "Share" in the top-right corner
3. Add the service account email (from the JSON file) as an editor
4. Copy the Sheet ID from the URL

### Step 5: Configure Environment Variables

Edit your `.env.local` file:

```env
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
Your private key here
-----END PRIVATE KEY-----
"
```

**Important**: 
- The spreadsheet ID is found in the Google Sheets URL between "/d/" and "/edit"
- The private key should include the full key with proper line breaks
- Keep the quotes around the private key

## Project Structure

```
nsdc-form/
├── src/
│   ├── app/
│   │   ├── api/submit/          # API route for form submission
│   │   ├── globals.css          # Global styles and theme
│   │   ├── layout.js           # Root layout
│   │   └── page.js             # Main page component
│   ├── components/
│   │   ├── WelcomePage.js      # Welcome screen with intro
│   │   ├── SurveyForm.js       # Main form component
│   │   ├── SectionNavigation.js # Section navigation sidebar
│   │   └── QuestionRenderer.js  # Individual question components
│   └── data/
│       └── sugar-survey-questions.json # Survey configuration
├── public/
│   └── nsdc.png                # NSDC logo
└── surveys/
    └── sugar-survey-1.md       # Original survey markdown
```

## Survey Flow

1. **Welcome Page**: Displays introduction, confidentiality notice, and instructions
2. **Section Navigation**: Shows all 6 sections with progress tracking
3. **Form Sections**:
   - Section 1: Company Profile
   - Section 2: Sugar Consumption Volume & Value
   - Section 3: Sugar Alternatives and Sweeteners
   - Section 4: Consumption Drivers & Market Factors
   - Section 5: Future Outlook & Forecasts
   - Section 6: Survey Feedback
4. **Submission**: Data sent to Google Sheets via API

## Customization

### Theme Colors

Colors are defined in `src/app/globals.css`. The theme includes:
- Primary: Blue tones
- Secondary: Green tones  
- Accent: Amber tones
- NSDC Brand: Green (#00962E) and Red (#FF0001)

### Question Types

The form supports various question types:
- `text`: Single-line text input
- `textarea`: Multi-line text input
- `number`: Numeric input with optional units
- `radio`: Single selection with optional text field
- `checkbox`: Multiple selection
- `select`: Dropdown selection
- `table`: Data grid with multiple columns
- `repeatable`: Dynamic list of items
- `percentage`: Percentage inputs that sum to 100%
- `group`: Grouped form fields
- `rating`: 1-5 scale with N/A option

### Adding New Questions

Edit `src/data/sugar-survey-questions.json` to modify the survey structure.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Traditional hosting with Node.js

## API Endpoints

### POST /api/submit

Submits survey data to Google Sheets.

**Request Body:**
```json
{
  "surveyId": "nsdc-sugar-survey-2025",
  "responses": {
    "section1": {
      "companyName": "Example Corp",
      "primaryIndustry": "bakery-confectionery"
    }
  },
  "submittedAt": "2025-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Survey submitted successfully",
  "submissionId": "nsdc_1234567890_abc123"
}
```

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary to the National Sugar Development Council (NSDC) of Nigeria.

## Support

For technical support or questions about the survey, please contact the NSDC development team.
