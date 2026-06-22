# my-story-blog
A blog just for me to post my stories

## Admin email setup

The admin dashboard now sends emails through a Vercel serverless function at `/api/send-email`.

Set these environment variables in Vercel before deploying:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL` - a sender address on a domain verified in Resend
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

If you want to test locally, point the frontend at your local Vercel dev server with `VITE_API_BASE_URL`.

If you are using `api-keys-1782133775814.csv`, copy the `token` value from that export into `RESEND_API_KEY`.
