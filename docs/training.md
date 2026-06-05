# Training Courses

ApiSpi offers hands-on AI training for individuals and teams. Courses cover practical AI adoption, prompt engineering, and enterprise strategy.

## Courses

| Course | Format | Price |
|---|---|---|
| Introduction to AI | Full Day Workshop | $1,500/person |
| Digital Avatar | Online | $250/avatar |
| Prompt Engineering Masterclass | Workshop | $750/person |
| AI for Business Leaders | Half Day Workshop | $995/person |
| Building AI Agents with APIs | Online (3-day) | $1,200/person |
| Enterprise AI Strategy | 2-day Workshop | $2,500/person — includes certification |

"Introduction to AI" is the most popular course. "Enterprise AI Strategy" awards a completion certification.

## Booking

Training is listed on the public page at `/training`. The page is seeded from the `trainings` table managed via the admin panel at `/admin/trainings`.

Admins can create, edit, and delete training entries. Each training record stores:
- `title`, `description`, `duration`
- `price`, `format` (e.g. Workshop, Online)
- `is_featured`, `sort_order`
