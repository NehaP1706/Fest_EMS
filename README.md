# Specifications:

## Libraries, Frameworks and Modules:

### **Core Framework & Build Tool**
* **React (19.2.0)**: Selected for its component-based architecture and latest performance enhancements like concurrent rendering and automatic batching.
* **Vite (7.2.4)**: Used as the build tool for its lightning-fast and optimized build process compared to traditional tools.

### **Navigation & UI**
* **React Router DOM (7.13.0)**: Manages client-side routing, enabling protected routes and role-based access control (Participant, Organizer, Admin).
* **Tailwind CSS (3.4.1)**: A utility-first CSS framework used for rapid UI development and consistent design without writing custom CSS files.
* **React Icons (5.5.0)**: Provides a comprehensive set of SVG icons to maintain a professional and consistent visual identity across the platform.

### **Data & State Management**
* **Axios (1.13.4)**: Chosen over the native Fetch API for its automatic JSON transformation and support for request/response interceptors used for JWT injection.
* **Fuse.js (7.1.0)**: Implements lightweight fuzzy search, allowing users to find events even with partial matches or minor typos.
* **Recharts (3.7.0)**: Used in the Organizer dashboard to render analytics such as registration trends and rating distributions.

### **Real-time & Specialized Features**
* **Socket.IO Client (4.8.3)**: Enables real-time, bidirectional communication for the discussion forum, allowing instant message updates and reactions.
* **html5-qrcode (2.3.8)**: Powers the QR Scanner feature, allowing organizers to track attendance via device cameras or file uploads.

### **Server & Database**
* **Express (4.18.2)**: The core web framework used to build the RESTful API and handle middleware integration.
* **Mongoose (8.0.3)**: An ODM for MongoDB that provides schema-based validation and simplified query building for complex data models.

### **Security & Authentication**
* **jsonwebtoken (9.0.2)**: Implements stateless JWT authentication, supporting the 7-day session persistence requirement.
* **bcryptjs (2.4.3)**: Used for secure password hashing with 10 salt rounds to protect user credentials against brute-force attacks.
* **Helmet (7.1.0)**: Secures the application by setting various HTTP headers to prevent common vulnerabilities.
* **CORS (2.8.5)**: Configured to allow secure cross-origin communication between the frontend and backend across different domains.

### **Utility & Middleware**
* **Express-validator (7.0.1)**: Used to sanitize and validate user input, specifically for verifying IIIT-specific email domains.
* **Multer (2.0.0-rc.4)**: Handles multipart/form-data for the Merchandise Payment Approval workflow (uploading payment proofs).
* **QRCode (1.5.3)**: Generates unique QR codes on the backend to be sent to participants as part of their event tickets.
* **Nodemailer (6.9.7)**: Automates email delivery for registration confirmations, ticket attachments, and password reset workflows.
* **Morgan (1.10.0)**: Provides HTTP request logging for easier debugging and monitoring of API traffic.
* **Dotenv (16.0.3)**: Manages environment variables to keep sensitive keys like `MONGODB_URI` and `JWT_SECRET` out of the codebase.

### Development Tools
* **Nodemon (3.0.2)**: Enhances developer productivity by automatically restarting the server whenever code changes are detected.
* **ESLint**: Ensures code quality and consistency by enforcing a set of linting rules across the project.

## Advanced Features:

### Tier A - Merchandise Payment Approval Workflow

**JUSTIFICATION**: Since registration fee payment workflow was to implemented (according to the doubt clarification document), an analogous system was built for Merchandise Payment.

**Design Choice and Implementation**: 
- Customer uploads proof of payment - PDF/JPG/JPEG/PNG file.
- Merchandise Claim reaches a "PENDING" state until the Organizer approves.
- Stock is reserved upon submission, decremented upon approval and released upon rejection.
- Reason for rejection is conveyed and resubmission is allowed.
- Email notifications for approval and rejection.

**Schema**:
```c
{
  status: 'pending' | 'approved' | 'rejected',
  paymentProofUrl: String,
  rejectionReason: String,
  approvedBy: ObjectId,
  approvedAt: Date
}
```

### Tier A - QR Scanner & Attendance Tracking

**JUSTIFICATION**: To support the "Analytics" tab for Organizer views, and perform useful evaluations we use attendance of Events. This can be tracked by the Organizer for popularity as well.

**Design Choice and Implementation**: 
- Camera-based QR code scanning that takes permission to access camera and can also scan attached image files.
- Duplicate scanning is prevented using timestamp.
- Live attendance is reflected for the Organizer in the "Participants" tab.
- Manual override for attendance toggling is enabled.
- Attendance reports can be exported as csv files with timestamp, participant details etc.
- Pie chart with proportions are real-time synced.

**Schema**:
```c
{
  ticketId: 'TKT-timestamp-random',
  eventId, participantId, eventName
}
```

### Tier B - Real-time Discussion Forum

**JUSTIFICATION**: Participants may ask queries to the organizer, send supportive messages etc. live. Organizer has complete moderation control and can delete and pin any message on the forum to prevent misuse or spam. Can be used to enquire certain details or clarify deadlines etc.

**Design Choice and Implementation**: 
- Uses Socket.io based real time messaging.
- Upon loading the page, the client enters the room with a designated timeout for inactivity.
- Optimistic UI updates allow instant feedback.
- Reactions, pins, deletions and announcements have been implemented as instructed.

### Tier B - Organizer Password Reset Workflow

**JUSTIFICATION**: In case of any mishaps that causes the organizer password leaks, the organizer may submit a password reset request to the Admin. The Admin can choose to approve/reject and notify the same.

**Design Choice and Implementation**: 
- The password reset action is availed at the organizer profile with the history of approval/rejections displayed with reason.
- Admin dashboard receives all results with Organizer name and reason for request.
- Admin may decide to approve, in which case the password is shared to the Organizer.
- Admin rejections are notified aptly.

### Tier C - Anonymous Feedback System

**JUSTIFICATION**: Feedback can help improve the functioning and internals of the organizing committee and is thus a useful feature to have. Analytics and report exports help in the long run to evaluate importance and improvement.

**Design Choice and Implementation**: 
- Participant may only submit feedback once, to prevent favourism.
- Feedback is kept anonymous to the Organizer.
- Ratings, Date and comments are captured.

**Schema**:
```c
{
  event: ObjectId,
  participant: ObjectId, 
  rating: Number (1-5),
  comment: String,
  isAnonymous: true, 
  submittedAt: Date
}
```

## Instruction to run project locally

Use the following files without the `_5000` in their names to run locally seamlessly:

```c
backend/server_5000.js
backend/env_5000.js
frontend/env_5000.js
```

General run instructions for backend and frontend separate: 

```c
cd backend
npm install
npm run dev
```

```c
cd frontend
npm install
npm run dev
```

Access the project at `http://localhost:5173/`

After substitution, run the following commands from the root:

```c
cd frontend
npm run build
cp ./dist/ ../backend/
cd ..
npm start
```

Proceed to access the entire project on `http://localhost:5000/`

NOTE: The mailing services and uploads will not work for the deployed version, all other features are available at: `https://fest-ems.vercel.app/`