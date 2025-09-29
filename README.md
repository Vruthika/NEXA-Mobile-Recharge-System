---
# 📱 NEXA Mobile Recharge System

A modern, feature-rich **Mobile Recharge System** built with **HTML, JavaScript, and Tailwind CSS**, designed for **seamless mobile recharge operations, plan management, and administrative control**.
---

## 🚀 Features

- 🔐 **Authentication** – Secure login, signup, and password reset
- 📊 **Admin Dashboard** – Comprehensive overview of system performance and transactions
- 👥 **Customer Management** – Manage customer accounts and profiles
- 💳 **Recharge Management** – Process mobile recharges for various operators
- 📱 **Plan Management** – Create, update, and manage recharge plans (Prepaid/Postpaid)
- 🔄 **Transaction History** – Track all recharge transactions and payments
- 📝 **Content Management** – Dynamic content management for banners, notifications, and FAQs
- 💾 **Backup & Restore** – Automated data backup and system restore capabilities
- 📈 **Reports & Analytics** – Revenue and transaction reports
- 🔔 **Notifications & Alerts** – System alerts and transaction updates
- ⚙️ **System Configuration** – Admin settings and password management
- 📱 **Responsive Design** – Optimized for all devices with mobile-first approach

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Tailwind CSS
- **Architecture**: Feature-based modular structure
- **Styling**: Global + feature-specific CSS with Tailwind
- **Utilities**: Modular helper functions for API calls, authentication, and validation
- **Assets**: Images, icons, fonts for modern mobile-first UI
- **Storage**: Local storage / Database integration for data persistence

---

## 📁 Project Structure

```
NEXA-Mobile-Recharge-System/
├── assets/
│   ├── css/
│   │   └── styles.css                 # Global styling
│   ├── images/                        # Static assets (logos, banners, icons)
│   │   ├── 5G_card.png
│   │   ├── carousel-1.jpg
│   │   ├── logo-footer.jpg
│   │   ├── logo.png
│   │   └── mobile_screen.png
│   └── js/
│       └── navbar-loader.js           # Navbar utility functions
│
├── components/                        # Reusable UI components
│   ├── admin-sidebar.html             # Admin navigation sidebar
│   ├── footer.html                    # Footer component
│   ├── navbar.html                    # Navigation bar
│   ├── navbar.js                      # Navbar functionality
│   └── terms.html                     # Terms & conditions modal
│
├── pages/
│   ├── admin/                         # Admin-side features
│   │   ├── backup-restore/            # Data backup & restore management
│   │   ├── customers/                 # Customer account management
│   │   ├── dashboard/                 # Admin dashboard (overview, stats)
│   │   ├── manage-content/            # Dynamic content management
│   │   ├── plans/                     # Recharge plan management
│   │   ├── report/                    # Analytics & reporting
│   │   ├── settings/                  # System configuration & settings
│   │   └── transactions/              # Transaction monitoring & management
│   │
│   ├── auth/                          # Authentication system
│   │   ├── forgot-password/           # Password recovery
│   │   ├── login/                     # User login
│   │   └── register/                  # User registration
│   │
│   ├── customer/                      # Customer-side features
│   │   ├── dashboard/                 # Customer dashboard
│   │   ├── history/                   # Transaction history
│   │   ├── landing/                   # Homepage (landing page)
│   │   ├── payment/                   # Payment processing
│   │   ├── plans/                     # Available plans browsing
│   │   ├── postpaid/                  # Postpaid recharge services
│   │   ├── prepaid/                   # Prepaid recharge services
│   │   └── profile/                   # Customer profile management
│   │
│   ├── info/                          # Information pages
│   │   ├── 5G.html                    # 5G services information
│   │   ├── about.html                 # About us page
│   │   └── nexaGroups.html            # Company information
│   │
│   └── support/                       # Customer support
│       ├── contact.html               # Contact us page
│       └── contact.js                 # Contact form functionality
│
└── README.md                          # Documentation
```

---

## 📡 API Endpoints

The application currently interacts with mock services. Replace these with your production API as needed.

```javascript
const API = {
  customers: "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Customers",
  plans: "https://68c7990d5d8d9f5147324d39.mockapi.io/v1/Plans",
  transactions: "https://68ca32f2430c4476c3488311.mockapi.io/Transactions",
};
```

---

## 🏃‍♂️ Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/Vruthika/NEXA-Mobile-Recharge-System.git
   cd NEXA-Mobile-Recharge-System
   ```

2. **Open the application**

   ```bash
   # For Customer Interface
   open pages/customer/landing/landing.html
   ```

   ```bash
   # For Admin Interface
   open pages/admin/dashboard/dashboard.html
   ```

3. **Login Credentials for Admin**

   Email ID : admin@gmail.com

   Password : admin@123

4. Start recharging mobiles and managing plans! 🎉

---

## 🎯 Usage

- **Customer Side**

  - Register/Login to your account
  - Browse available plans for different operators
  - Recharge mobile numbers instantly (Prepaid/Postpaid)
  - View comprehensive transaction history
  - Update profile and account settings
  - Access 5G services and company information

- **Admin Side**

  - Monitor dashboard with real-time insights
  - Manage customers and their accounts
  - Create and update recharge plans for various operators
  - View all transaction records and analytics
  - Manage dynamic content (banners, notifications, promotions)
  - Perform system backups and restore data when needed
  - Generate revenue and sales reports
  - Configure system settings and operator management

---

## 🏗️ System Architecture

- **Feature-based Modular Structure** → Each functionality (payment, plans, content, backup) is isolated
- **Reusable Components** → Common UI elements shared across modules
- **Separation of Concerns** → Clear division between UI, business logic, and utilities
- **Scalable Design** → Easy to extend with new operators, payment methods, and features
- **Responsive Framework** → Mobile-first approach with Tailwind CSS
- **Data Persistence** → Robust backup and restore system for data safety

---

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📄 License

MIT License – free to use and modify for learning and development purposes.

---

**Built with ❤️ to simplify mobile recharges and digital payments**

⭐ **Star this repo if you find it helpful!**

---
