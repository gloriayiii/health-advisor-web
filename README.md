# Health Advisor Web

A Next.js-based web application for clinicians to review and modify AI-generated patient recommendations. This system allows doctors to connect with their corresponding mobile app and review LLM-generated suggestions for patient care.

## Features

- **Doctor Authentication**: Secure login system for medical professionals
- **Patient Dashboard**: Overview of all patient cases with status tracking
- **AI Recommendation Review**: View and analyze LLM-generated treatment suggestions
- **Clinical Decision Support**: Approve, reject, or modify AI recommendations
- **Real-time Status Updates**: Track review progress and case urgency
- **Modern UI/UX**: Clean, responsive design optimized for clinical workflows
- **Next.js App Router**: Modern routing with server-side rendering capabilities

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
   ```bash
   cd health-advisor-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Demo Credentials

For testing purposes, use these credentials:
- **Username**: `doctor`
- **Password**: `password`

## Project Structure

```
├── app/
│   ├── layout.js         # Root layout component
│   ├── page.js           # Home page (Dashboard/Login)
│   ├── patient/[id]/
│   │   └── page.js       # Dynamic patient review page
│   └── globals.css       # Global styles
├── components/
│   ├── Login.js          # Authentication component
│   ├── Dashboard.js      # Main dashboard with patient overview
│   ├── PatientReview.js  # Individual patient case review
│   └── styles/
│       ├── Login.css     # Login component styles
│       ├── Dashboard.css # Dashboard component styles
│       └── PatientReview.css # Patient review styles
├── contexts/
│   └── AuthContext.js    # Authentication state management
├── next.config.js        # Next.js configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## Key Components

### Dashboard
- Displays patient statistics and case overview
- Shows pending, reviewed, and urgent cases
- Quick access to patient review interface

### Patient Review
- Comprehensive patient information display
- AI-generated recommendation review
- Clinical decision tools (approve/reject/edit)
- Real-time status tracking

### Authentication
- Secure doctor login system
- Session management with localStorage
- Role-based access control

## Technology Stack

- **Next.js 14**: React framework with App Router
- **React 18**: Modern React with hooks
- **CSS Modules**: Separate CSS files for styling
- **Lucide React**: Modern icon library
- **Context API**: State management
- **TypeScript**: Type safety and better development experience

## Future Enhancements

- Integration with real backend APIs
- Real-time notifications
- Advanced filtering and search
- Audit trail for clinical decisions
- Integration with hospital systems
- Mobile responsiveness improvements
- Server-side rendering optimizations
- API routes for backend integration

## Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Code Style

The project follows modern Next.js and React best practices:
- Functional components with hooks
- App Router for routing
- Client-side components with 'use client' directive
- Separate CSS files for styling
- Context API for state management
- Component composition over inheritance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
