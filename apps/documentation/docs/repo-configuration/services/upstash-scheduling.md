# Upstash Schedules

This guide walks you through integrating **Upstash** into a **T3 Stack** app using **Next.js 15** with the **App Router** we've started using this more frequently for the scheduling capabilities it can offer as an alternative to CRON jobs and that's what this guide will cover.

---

## ⚙️ Prerequisites

Make sure your project is set up with:

- [Next.js 15 (App Router)](https://nextjs.org/blog/next-15)
- Node.js 18+

---

## Guide

Particularly for the repo section of this guide, the code we write could in theory constantly change so I won't include any code examples but I would recommend checking out this repo for PierTwo which should give a look into how we have set this up (https://github.com/Labrys-Group/PierTwo).

**Vercel:**

- Find the project you want to make use of these scheduled tasks and go to the settings for this project
- Go to "Deployment Protection"
- Enable "Protection bypass for Automation"
- Take note of the "VERCEL_AUTOMATION_BYPASS_SECRET" we'll need this for Upstash

**Upstash:**

- First thing we need to do is create an account (start with the free tier) (https://console.upstash.com/login)
- Navigate to the "QStash" tab along the top
- In the "Overview" section we'll want to take note of the "QSTASH_URL", "QSTASH_TOKEN", "QSTASH_CURRENT_SIGNING_KEY" and "QSTASH_NEXT_SIGNING_KEY" as we'll need them as environment variables in our repo

**Repo:**

- Add those environment variables into your repo
- Install dependencies
  pnpm i @upstash/qstash
- Create a new folder "scripts" in src/app
- Create a file "scheduleJobs.ts" and this is where initiate our QStash client and stand up all the jobs we want to use
- Each job has a specified URL (which will tell us which route to hit), ID and CRON
- From here just create a route.ts file wherever you want it with 2 routes
  - a GET which will return a health status for the route
  - a POST which will run the actual logic
- I'd recommend wrapping every POST request within "verifySignatureAppRouter" for verification purposes which comes from "@upstash/qstash/nextjs"

**Upstash:**

- Last thing we need to do after we deploy the repo to Vercel is we need to create the schedules on Upstash
- Navigate back to the Upstash console and go to the QStash tab (https://console.upstash.com/qstash)
- Go to "Schedules" and create any that you need (without creating them client side I don't believe the code will execute)
- These schedules will need to point to the route in the project we want to hit
- These schedules will need to use the "VERCEL_AUTOMATION_BYPASS_SECRET" in the URL
- These schedules will (likely) need to set their "Upstash-Method" to "POST"
- Here is an example of one of the schedules we use in PierTwo for hitting a route.ts file located in 'src/app/api/consolidate/route.ts'
  (https://pier-two-pectra.vercel.app/api/consolidate?x-vercel-protection-bypass=XXX)
- From here you can pause and activate your schedules at your leisure using the Upstash console

**Logs**

If you want to see any logs for your schedules, the Upstash console will keep track of last run time, run status etc or the logs section in Vercel can indicate when a specific route has been hit.
