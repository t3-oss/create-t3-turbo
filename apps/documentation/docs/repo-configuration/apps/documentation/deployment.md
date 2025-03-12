---
sidebar_position: 2
---

# Deployment

To share with PMs and clients this Docusaurus project can be deployed through Vercel and secured using Clerk.

### Clerk

Docusaurus is configured to use Clerk for authentication. Follow the steps below to set up a new Clerk Application.

1. Sign in to [Clerk](https://dashboard.clerk.com), it's best to use a group email address for the project (e.g. `project@labrys.io`)
2. In the dashboard click "Create application"
3. Enter a name and click "Create application"
4. Once the application has been created, navigate to the "Configure" tab
5. In the left sidebar click on "Restrictions" then set the "Sign-up mode" to "Restricted". This makes it so that only invited users are able to access the docs.

:::tip
To invite users go to the "Users" tab then the "Invitations" tab
:::

### Vercel

This application is configured to be deployed through Vercel. Make sure to follow the above setup for creating a Clerk application, then we need to set some environment variables in Vercel.

Create a new application on Vercel and connect to your repo. Set the application directory to `apps/documentation`.

In Clerk navigate to "Configure" then scroll down to "Developers > API Keys". Copy the following into Vercel:

- `CLERK_FRONTEND_URL`: The Frontend API URL from the right side of the page
- `CLERK_PUBLISHABLE_KEY`: The Public key under "Publishable Key"
- `CLERK_SECRET_KEY`: The default secret key under "Secret keys"
