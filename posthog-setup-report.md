<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Bora na Tech platform. PostHog was initialized in `client/src/main.tsx` using environment variables, with autocapture enabled by default (tracking clicks, form submissions, and pageviews automatically). User identification was wired into the `AuthContext` so that users are identified on sign-in, re-identified on page refresh (via `onAuthStateChange`), and their identity is reset on sign-out. Eight custom events were instrumented across five files to track the most business-critical user actions.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User successfully creates an account | `client/src/contexts/AuthContext.tsx` |
| `user_signed_in` | User successfully logs in | `client/src/contexts/AuthContext.tsx` |
| `user_signed_out` | User logs out of the platform | `client/src/contexts/AuthContext.tsx` |
| `checkout_started` | User initiates Pro plan checkout (R$24/mês) | `client/src/components/pro/ProGate.tsx` |
| `quiz_completed` | User completes the career quiz and gets a result | `client/src/pages/QuizCarreira.tsx` |
| `search_performed` | User performs a search and gets results | `client/src/components/SearchBar.tsx` |
| `search_result_clicked` | User clicks on a search result | `client/src/components/SearchBar.tsx` |
| `favorite_toggled` | User saves or removes a resource from favorites | `client/src/hooks/useFavorites.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/411657/dashboard/1549676
- **Signups & Logins over time**: https://us.posthog.com/project/411657/insights/Qr7KGIqs
- **Signup → Quiz completion funnel**: https://us.posthog.com/project/411657/insights/GHFIUAEs
- **Pro checkout conversion funnel**: https://us.posthog.com/project/411657/insights/Kh0ov9BJ
- **Search activity**: https://us.posthog.com/project/411657/insights/We0pn6TI
- **Favorites by resource type**: https://us.posthog.com/project/411657/insights/jzg770Zh

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-javascript_web/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
