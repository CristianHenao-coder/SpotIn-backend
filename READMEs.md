readme 

School Attendance Admin System

A web-based school attendance management system powered by dynamic QR codes, designed for educational administrators to manage students, classrooms, schedules, and attendance efficiently.

📌 What is this project?

This is an administrative web application that allows institutions to:

Track student attendance using dynamic, time-based QR codes

Enforce schedules, lateness tolerance, and attendance rules

Manage students, classrooms, and schedules

View attendance statistics and reports

Maintain full traceability through audit logs

It is designed for schools, academies, universities, and educational institutions that need a modern, secure, and automated attendance system.

🎯 What problem does it solve?

❌ Eliminates manual attendance tracking

❌ Prevents impersonation and out-of-schedule check-ins

❌ Centralizes academic and attendance data

❌ Reduces human error

✅ Improves control, traceability, and operational efficiency

🧱 General architecture

Frontend & Backend in a single project (Next.js App Router)

Protected internal API using JWT authentication

MongoDB database

Role-based access control via middleware

Dynamic QR codes with automatic expiration

🧩 Main features (Admin Panel)

Dashboard → global metrics overview

Classrooms → classroom management

Students → student management

Schedules → time rules and lateness tolerance

QR Sessions → dynamic QR generation

Attendance → attendance records and history

Reports → statistics and analysis

Settings → global system configuration

🛠️ Technologies used
Frontend

Next.js (App Router)

React + TypeScript

Tailwind CSS (Dark UI – purple/black theme)

Native Fetch API

Backend

Next.js API Routes

Node.js

MongoDB + Mongoose

Zod (request validation)

JWT (authentication)

Role-based middleware

AuditLog for traceability

📂 Project structure (summary)
src/
 ├── app/
 │   ├── admin-web/        # Admin panel
 │   ├── api/              # Protected API routes
 │   └── login/            # Admin login
 ├── components/           # Reusable UI components
 ├── lib/                  # Auth, DB, helpers
 ├── models/               # Mongoose models
 └── middleware.ts         # Global security

🚀 How to run the project
1️⃣ Clone the repository
git clone <repo-url>
cd project

2️⃣ Install dependencies
npm install

3️⃣ Configure environment variables

Create a .env file:

MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key

4️⃣ Run in development mode
npm run dev


Open in your browser:

http://localhost:3000

🔐 Access & Security

Secure login using email + password

ADMIN role required for admin panel access

JWT tokens sent via Authorization: Bearer

📈 Project status

✅ Backend completed
✅ Authentication & security
✅ Fully functional Admin Panel
✅ Dynamic QR system working
🟡 Mobile scanner view (future)
🟡 Advanced exports & analytics

🧠 Design approach

Modern dark UI (black + purple)

Clean, professional UX

Built for real-world production use

Scalable and maintainable architecture

✍️ Authors

GitHub: cristian-henao-coder

💻 Developer / Contributor
Emanuel - Cristian Henao