## Directory Structure:

```c
Fest_EMS
├── backend
│   ├── config
│   │   ├── db.js
│   │   └── email.js
│   ├── controllers
│   │   ├── adminController.js
│   │   ├── attendanceController.js
│   │   ├── authController.js
│   │   ├── discussionController.js
│   │   ├── eventController.js
│   │   ├── feedbackController.js
│   │   ├── merchandiseController.js
│   │   ├── organizerController.js
│   │   ├── registrationController.js
│   │   └── userController.js
│   ├── middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── roleCheck.js
│   ├── models
│   │   ├── Attendance.js
│   │   ├── Discussion.js
│   │   ├── Event.js
│   │   ├── Feedback.js
│   │   ├── MerchandisePurchase.js
│   │   ├── Organizer.js
│   │   ├── PasswordResetRequest.js
│   │   ├── Registration.js
│   │   └── User.js
│   ├── package.json
│   ├── routes
│   │   ├── admin.js
│   │   ├── attendance.js
│   │   ├── auth.js
│   │   ├── discussions.js
│   │   ├── events.js
│   │   ├── feedback.js
│   │   ├── merchandise.js
│   │   ├── organizers.js
│   │   ├── registrations.js
│   │   └── users.js
│   ├── server.js
│   ├── uploads
│   └── utils
│       ├── emailTemplates.js
│       ├── qrGenerator.js
│       ├── ticketGenerator.js
│       └── validators.js
├── deployment.txt
├── frontend
│   ├── package.json
│   ├── public
│   ├── src
│   │   ├── App.jsx
│   │   ├── components
│   │   │   ├── admin
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ManageClubs.jsx
│   │   │   │   └── PasswordResets.jsx
│   │   │   ├── common
│   │   │   │   ├── Loader.jsx
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── organizer
│   │   │   │   ├── CreateEvent.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── EventDetail.jsx
│   │   │   │   ├── MerchandiseApproval.jsx
│   │   │   │   ├── Profile.jsx
│   │   │   │   └── QRScanner.jsx
│   │   │   ├── participant
│   │   │   │   ├── BrowseEvents.jsx
│   │   │   │   ├── ClubListing.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── EventDetails.jsx
│   │   │   │   ├── OrganizerDetail.jsx
│   │   │   │   └── Profile.jsx
│   │   │   └── shared
│   │   │       ├── DiscussionForum.jsx
│   │   │       └── FeedbackForm.jsx
│   │   ├── contexts
│   │   │   └── AuthContext.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   ├── services
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   └── utils
│   │       ├── constants.js
│   │       └── helpers.js
│   └── vite.config.js
└── README.md

21 directories, 72 files
```
