# NextChan

Just a little experiment to play around with some technologies.
Mostly vibe coded it in Cursor so no guarantees.

A modern imageboard built with Next.js, TypeScript, and SQLite.

## Features

- **Simple and Clean UI**: Modern UI with a focus on usability
- **Boards**: Organize posts into different topic boards
- **Nested Replies**: Support for threaded conversations with nested replies
- **Breadcrumb Navigation**: Easy navigation through thread hierarchies
- **Real-time Preview**: See a preview of posts you're replying to
- **Responsive Design**: Works on mobile, tablet and desktop

## Technology Stack

- **Frontend**: Next.js 14 with App Router and React
- **UI Components**: Built with shadcn/ui for a consistent design
- **Database**: SQLite with better-sqlite3 for simple, file-based storage
- **Styling**: Tailwind CSS for responsive, utility-first styling
- **Language**: TypeScript for type safety and better developer experience

## Getting Started

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

## Project Structure

- `src/app` - Next.js App Router pages
- `src/components` - Reusable React components
- `src/lib` - Utility functions, database handling, and type definitions
- `data` - Contains the SQLite database file

## Features

### Boards
NextChan supports multiple boards for organizing discussions by topic.

### Threads and Replies
Create new threads or reply to existing ones. Replies can be nested for better conversation flow.

### Navigation
Easy navigation with breadcrumbs showing the thread hierarchy.

## License

This project is licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](LICENSE) - see the LICENSE file for details.
