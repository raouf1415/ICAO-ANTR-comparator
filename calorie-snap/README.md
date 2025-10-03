# Calorie Snap 🍎📸

A production-ready Progressive Web App (PWA) that estimates calories from food photos using AI. Built with React, TypeScript, TensorFlow.js, and TailwindCSS.

## Features

- 📱 **Mobile-First PWA**: Installable on mobile devices with offline capabilities
- 🤖 **AI Food Recognition**: Uses TensorFlow.js for on-device food classification
- 📊 **Nutrition Data**: Integrates with Nutritionix and CalorieNinjas APIs
- 📷 **Camera Integration**: Access device camera with fallback to file upload
- 💾 **Local Storage**: IndexedDB for history, localStorage for preferences
- 🔒 **Privacy-First**: All image processing happens locally, no uploads
- 📈 **History & Export**: Track your food intake with CSV export
- ⚙️ **Customizable**: Configurable API keys, units, and preferences

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- HTTPS-enabled development server (required for camera access)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd calorie-snap

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your API keys to .env (optional but recommended)
# See "Getting API Keys" section below

# Start development server
npm run dev

# Open https://localhost:5173 in your browser
# Note: HTTPS is required for camera access
```

### Building for Production

```bash
# Build the app
npm run build

# Preview the production build
npm run preview
```

## Getting API Keys

### Nutritionix API (Recommended)

1. Visit [Nutritionix API](https://www.nutritionix.com/business/api)
2. Sign up for a free account
3. Get your App ID and API Key
4. Add them to your `.env` file:

```env
VITE_NUTRITIONIX_APP_ID=your_app_id_here
VITE_NUTRITIONIX_API_KEY=your_api_key_here
```

### CalorieNinjas API (Fallback)

1. Visit [CalorieNinjas](https://calorieninjas.com/)
2. Sign up for a free account
3. Get your API Key
4. Add it to your `.env` file:

```env
VITE_CALORIE_NINJAS_KEY=your_api_key_here
```

### Local Database (No API Keys Required)

If you don't have API keys, the app will use a limited local food database with approximate values for common foods like:
- Apple, Banana, Rice, Chicken Breast
- Pizza, Hamburger, Pasta, Bread
- Eggs, Milk, and more

## Usage

### Taking Photos

1. **Camera Access**: Tap "Take Photo" to open your device camera
2. **File Upload**: Use "Upload Photo" if camera access is denied
3. **Positioning**: Center your food in the frame for best results
4. **Capture**: Tap the capture button to take the photo

### Food Recognition

1. **AI Analysis**: The app analyzes your photo using TensorFlow.js
2. **Suggestions**: Get top 3 food predictions with confidence scores
3. **Manual Search**: If AI can't identify the food, search manually
4. **Selection**: Choose the correct food from the suggestions

### Portion Sizing

1. **Servings Mode**: Adjust by serving size (0.25 - 3.0 servings)
2. **Weight Mode**: Adjust by grams or ounces (10g - 1000g)
3. **Quick Select**: Use preset buttons for common portions
4. **Manual Input**: Enter exact values using the input field

### Viewing Results

1. **Calories**: See total calories for your portion
2. **Macronutrients**: View protein, carbs, and fat breakdown
3. **Nutrition Info**: Per-100g values for reference
4. **Source**: See which API provided the data

### Managing History

1. **View History**: See all your previous scans
2. **Search**: Filter by food name
3. **Export**: Download CSV file with all data
4. **Delete**: Remove individual entries or clear all

## Technical Details

### Architecture

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS with custom components
- **State Management**: Zustand with persistence
- **AI Model**: TensorFlow.js (MobileNetV2 base)
- **Storage**: IndexedDB (idb) + localStorage
- **PWA**: Service Worker + Web App Manifest

### File Structure

```
src/
├── components/          # React components
│   ├── CameraCapture.tsx
│   ├── FoodSuggestions.tsx
│   ├── PortionPicker.tsx
│   ├── ResultCard.tsx
│   ├── HistoryList.tsx
│   └── Settings.tsx
├── lib/                 # Core functionality
│   ├── tfModel.ts       # TensorFlow.js integration
│   ├── nutrition.ts     # Nutrition API wrappers
│   ├── db.ts           # IndexedDB operations
│   └── export.ts       # CSV export utilities
├── types/              # TypeScript definitions
│   └── index.ts
├── styles/             # TailwindCSS styles
│   └── tailwind.css
└── __tests__/          # Unit tests
    ├── nutrition.test.ts
    └── export.test.ts
```

### Privacy & Security

- **No Image Uploads**: All photos stay on your device
- **Local Processing**: AI inference happens in the browser
- **API Calls**: Only food names sent to nutrition APIs
- **Local Storage**: All data stored on your device
- **HTTPS Required**: Secure connection for camera access

### Browser Support

- **Chrome/Edge**: Full support including camera access
- **Firefox**: Full support with camera access
- **Safari**: Full support (iOS 11.3+)
- **Mobile**: Optimized for iOS Safari and Android Chrome

## Development

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_NUTRITIONIX_APP_ID` | Nutritionix App ID | No |
| `VITE_NUTRITIONIX_API_KEY` | Nutritionix API Key | No |
| `VITE_CALORIE_NINJAS_KEY` | CalorieNinjas API Key | No |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Netlify

1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Add environment variables in Netlify dashboard

### Self-Hosted

1. Build the project: `npm run build`
2. Serve the `dist` folder with any static file server
3. Ensure HTTPS is enabled for camera access

## Troubleshooting

### Camera Not Working

- **HTTPS Required**: Camera access requires HTTPS in production
- **Permissions**: Allow camera permissions when prompted
- **File Upload**: Use file upload as fallback if camera fails
- **iOS Safari**: May require user interaction to enable camera

### API Errors

- **Check Keys**: Verify API keys are correctly set in `.env`
- **Rate Limits**: Free APIs have rate limits
- **Network**: Check internet connection
- **Fallback**: App will use local database if APIs fail

### Performance Issues

- **Model Loading**: First load may take time to download AI model
- **Image Size**: Large images may cause memory issues
- **Browser**: Use modern browsers for best performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [TensorFlow.js](https://www.tensorflow.org/js) for AI capabilities
- [Nutritionix](https://www.nutritionix.com/) for nutrition data
- [CalorieNinjas](https://calorieninjas.com/) for backup nutrition data
- [TailwindCSS](https://tailwindcss.com/) for styling
- [Lucide React](https://lucide.dev/) for icons

## Support

For issues and questions:
- Check the troubleshooting section above
- Open an issue on GitHub
- Review the documentation

---

**Note**: This app is for informational purposes only. Consult healthcare professionals for dietary advice.