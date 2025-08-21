# RepoArchive
A powerful tool for visualizing and summarizing GitHub repositories with ease.

## Features
- Generate diagrams from GitHub repository data using Mermaid.
- Summarize repository information with OpenAI integration.
- Intuitive user interface built with React and Tailwind CSS.
- TypeScript for enhanced code quality and maintainability.
- Linting with ESLint for consistent code style.

## Tech Stack
- Next.js
- React
- TypeScript
- Tailwind CSS
- Mermaid
- OpenAI API
- ESLint

You can check out the live website at [RepoArchive]((https://repolore.vercel.app))

## Usage

To generate a diagram from a GitHub repository:

1. Copy the URL of the GitHub repository you want to visualize.
2. Paste the URL into the input field on the application.
3. Click the "Generate Diagram" button to create the visualization.

## API Endpoints

### `/api/graph`
- **Method:** POST
- **Description:** Generates a diagram based on the provided GitHub repository URL.
- **Request Body:**
  ```json
  {
    "url": "https://github.com/user/repo"
  }
  ```

### `/api/summarize`
- **Method:** POST
- **Description:** Summarizes the repository information using OpenAI.
- **Request Body:**
  ```json
  {
    "url": "https://github.com/user/repo"
  }
  ```

## Roadmap
- [ ] Add support for additional diagram types.
- [ ] Implement user authentication for personalized features.
- [ ] Enhance the UI with more customization options.
- [ ] Expand API capabilities for more detailed summaries.




Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
