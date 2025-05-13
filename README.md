# NextChan

> [!NOTE] 
> 99% was vibe coded, gotta say I'm still really impressed by the overall look and usability, especially since it only took me about 2 hours to implement everything, which was mostly spent watching videos on YouTube waiting for the LLM to finish its work.

A beautiful, modern imageboard built with Next.js, TypeScript, and SQLite. Features a responsive design with elegant UI components and dynamic features.

![NextChan Screenshot](https://via.placeholder.com/800x450.png?text=NextChan+Screenshot)

## ✨ Features

- **Beautiful Modern UI**: Sleek design with smooth animations and beautiful gradients
- **Multiple View Modes**: Choose between traditional thread view and catalog grid layout
- **Boards**: Organize posts into different topic boards
- **Nested Replies**: Support for threaded conversations with nested replies
- **Real-time Statistics**: View post counts, file counts, and activity metrics
- **Breadcrumb Navigation**: Easy navigation through thread hierarchies
- **Image Attachments**: Support for uploading and viewing images with thumbnails
- **Reply References**: See a preview of posts you're replying to
- **Responsive Design**: Fully responsive across mobile, tablet, and desktop devices

## 🚀 Technology Stack

- **Frontend**: Next.js 14 with App Router and React Server Components
- **UI Components**: Custom design system built on shadcn/ui
- **Database**: SQLite with better-sqlite3 for simple, file-based storage
- **Styling**: Tailwind CSS for utility-first styling with custom animations
- **Language**: TypeScript for type safety and better developer experience
- **Icons**: Lucide icons for consistent visual language

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nextchan.git
   cd nextchan
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🏛️ Project Structure

- `src/app` - Next.js App Router pages and layouts
- `src/components` - Reusable React components and UI elements
- `src/lib` - Utility functions, database handling, and type definitions
- `data` - Contains the SQLite database file

## 🌟 Main Features Explained

### Homepage Dashboard
The homepage features a beautiful hero section with gradient background, dynamic stats dashboard showing real-time activity across the site, and a grid of available boards with activity indicators.

### Boards System
NextChan supports multiple boards for organizing discussions by topic. Each board has:
- Thread view for traditional post listing
- Catalog view for image-focused browsing
- Board-specific statistics
- Custom post creation form

### Thread and Reply System
- Create new threads or reply to existing ones
- Nested replies for better conversation flow
- Hover effects and visual indicators for thread hierarchies
- Quick-reply feature from any thread

### File Attachments
- Image upload support with preview
- File type detection
- Automatic thumbnail generation
- Gallery-style image viewing

### UI Components
- Beautiful cards with hover effects
- Consistent iconography throughout
- Breadcrumb navigation system
- Responsive pagination controls

## 🔮 Planned Features

- User authentication system
- Post searching and filtering
- Rich text formatting
- Theme customization
- Admin control panel

## 📜 License

This project is licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](LICENSE) - see the LICENSE file for details.
