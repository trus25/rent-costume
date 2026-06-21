# frontend-v2

React/Vite implementation for the Costume Rental redesign. This is currently frontend-only: flows use local mock state and browser storage so backend integration can be connected later without changing the UI structure.

## Run locally

```bash
npm install
npm run dev
```

Default local URL: `http://127.0.0.1:5174`.

Routes:

- `/` - customer catalogue, costume detail, and request cart
- `/admin/requests` - pending request queue and staff edit/reject/accept flow
- `/admin/rentals` - rental lifecycle, preparation checklist, delivery notes, payment proof, completion gate, and admin override
- `/admin/catalogue` - catalogue records, public visibility, variant quantities, and maintenance blocks
- `/admin/clients` - customer history and rental records
- `/admin/notifications` - unresolved operational alerts
- `/admin/settings` - branding and frontend behavior settings

The old static admin preview was removed. Staff access now goes through the React route guard at `/admin/login`.

## Implementation Notes

- UI labels resolve through shared Indonesian/English dictionaries.
- Icons use `lucide-react`.
- Admin tables use TanStack Table.
- Complex customer forms use React Hook Form and Zod.
- Tabs, dialogs, radio groups, selects, and switches use Radix primitives in the same style as shadcn/ui wrappers.

## Language

- Default: Indonesian (`?lang=id`)
- English: add `?lang=en`, for example `/?lang=en`
- Shared labels live in `i18n.js`; visible UI labels should resolve through the label map instead of hard-coded copy.
