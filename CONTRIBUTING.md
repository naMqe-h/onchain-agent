# Contributing to Onchain Agent

First off, thank you for considering contributing to Onchain Agent! We welcome any help, from reporting a bug to implementing a new feature. Every contribution is valuable.

This document provides a set of guidelines for contributing to the project.

## How Can I Contribute?

### Reporting Bugs

If you find a bug, please create an issue in our [issue tracker](https://github.com/naMqe-h/onchain-agent/issues). Make sure to include a clear title, a detailed description of the bug, and steps to reproduce it.

### Suggesting Enhancements

If you have an idea for a new feature or an improvement to an existing one, feel free to open an issue to discuss it. This allows us to coordinate efforts and ensure the suggestion aligns with the project's goals.

### Pull Requests

We love pull requests! If you're ready to contribute code, please follow the workflow below.

## Pull Request Workflow

Before starting any new work, please check the [existing issues](https://github.com/naMqe-h/onchain-agent/issues) to see if someone else is already working on a similar feature or bug. This helps avoid duplicate efforts.

1. **Fork the repository**
   Click the "Fork" button at the top right of the main repository page. This will create a copy of the repository in your own GitHub account.

2. **Create a feature branch**
   Clone your forked repository to your local machine and create a new branch for your changes. Use a descriptive branch name.
   ```sh
   git clone https://github.com/naMqe-h/onchain-agent.git
   cd onchain-agent
   git checkout -b feature/amazing-feature
   ```

3. **Local Setup**
   Set up your local environment by creating an environment file, installing dependencies, generating Prisma client, and starting the development server.

   * Copy the environment variables file:
     * Linux / macOS: `cp .env.example .env`
     * Windows CMD: `copy .env.example .env`
     * Windows PowerShell: `Copy-Item .env.example -Destination .env`
   * Install dependencies:
     ```sh
     npm install
     ```
   * Generate Prisma Client & Push DB schema:
     ```sh
     npx prisma generate
     npx prisma db push
     ```
   * Run the development server to verify everything works:
     ```sh
     npm run dev
     ```

4. **Commit your changes**
   Make your changes and commit them. This project follows the [**Conventional Commits**](https://www.conventionalcommits.org/en/v1.0.0/) specification. Commit messages should be prefixed with a type, such as `feat:`, `fix:`, `refactor:`, or `docs:`.
   ```sh
   git commit -m "feat: Add amazing new feature"
   ```

5. **Push to the branch**
   Push your changes up to your forked repository on GitHub.
   ```sh
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**
   Go to the original Onchain Agent repository and you will see a prompt to create a Pull Request from your new branch. Click it, and open a new PR against the `master` branch.

When you submit your pull request, please provide a clear description of the problem you are solving and the changes you have made. Include any relevant context, screenshots, or GIFs to help us understand your contribution.

Thank you for helping make Onchain Agent better!