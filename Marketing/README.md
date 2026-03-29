# Marketing Content

This folder is a file-based "CMS" for personalised marketing campaigns.

## Structure

- `Marketing/campaigns/*.json` - campaigns (message + tags)
- `Marketing/assets/*` - images/posters you want to reference from emails

## Campaign JSON format

Create a file like `Marketing/campaigns/spring-special.json`:

```json
{
  "id": "spring-special",
  "title": "Spring Specials",
  "subject": "Your next favourite is here",
  "tags": ["category:ramen", "weather:rainy"],
  "messageText": "Hi {{name}},\\n\\nWe picked something you’ll love based on your recent orders.",
  "messageHtml": "<p>Hi {{name}},</p><p>We picked something you’ll love based on your recent orders.</p>",
  "posterUrl": "https://example.com/posters/spring-special.png"
}
```

You can either:
- set `posterUrl` to an external link (Canva, S3, etc.), or
- set `posterPath` to a file under `Marketing/assets/...` (served by `GET /api/marketing/assets/*`)

### Tags (how matching works)

Campaign tags are matched against a customer's order history. The backend derives tags per ordered item:

- `item:<menuItemId>`
- `category:<categorySlug>`
- `weather:<weatherTag>` (e.g. `weather:hot`, `weather:rainy`)
- `flavor:<flavorTag>` (e.g. `flavor:spicy`, `flavor:umami`)

You can also use shorthand tags:

- `<categorySlug>` (same as `category:<slug>`)
- `<weatherTag>` (same as `weather:<tag>`)
- `<flavorTag>` (same as `flavor:<tag>`)

If a campaign has an empty `tags` array, it is sent to **all customers with an email**.

You can also force this behaviour by adding the tag `audience:all`.

## Backend endpoints

- `GET /api/marketing/campaigns` - list campaigns loaded from `Marketing/campaigns` (**staff auth required**)
- `GET /api/marketing/campaigns/:id` - fetch a single campaign (**staff auth required**)
- `POST /api/marketing/campaigns` - create/update a campaign JSON file (**staff auth required**)
- `GET /api/marketing/tag-options` - tag suggestions from the DB (**staff auth required**)
- `POST /api/marketing/campaigns/:id/send` - send a campaign via EmailJS (supports `dryRun`, **staff auth required**)

Example (dry run, returns matched recipients without sending):

```bash
curl -X POST http://localhost:4000/api/marketing/campaigns/sample-welcome/send \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d "{\"dryRun\": true, \"lookbackDays\": 90, \"limit\": 200}"
```

## EmailJS

Configure these backend env vars:

- `EMAILJS_SERVICE_ID`
- `EMAILJS_TEMPLATE_ID`
- `EMAILJS_PUBLIC_KEY`
- `EMAILJS_PRIVATE_KEY`
- `EMAILJS_API_URL` (optional, defaults to EmailJS REST `.../email/send`)

The backend sends template params:

- `to_email`, `to_name`
- `subject`
- `message_html`, `message_text`
- `campaign_id`, `campaign_title`, `campaign_tags`
- `poster_url`
