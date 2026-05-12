## Table `connections`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `investor_id` | `uuid` |  |
| `startup_id` | `uuid` |  |
| `status` | `varchar` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |

## Table `conversations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user1_id` | `uuid` |  |
| `user2_id` | `uuid` |  |
| `last_message_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `email_change_tokens`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `new_email` | `varchar` |  |
| `token` | `varchar` |  Unique |
| `expires_at` | `timestamp` |  |
| `created_at` | `timestamp` |  Nullable |
| `used_at` | `timestamp` |  Nullable |

## Table `investor_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `investor_profile_id` | `uuid` | Primary |
| `user_id` | `uuid` |  Unique |
| `name_or_firm` | `varchar` |  |
| `investor_type` | `investor_type_enum` |  |
| `years_of_experience` | `int4` |  |
| `professional_background` | `text` |  |
| `investment_thesis` | `text` |  |
| `industries_of_interest` | `jsonb` |  |
| `geographic_preference` | `jsonb` |  |
| `stage_preference` | `jsonb` |  |
| `min_investment_size` | `numeric` |  |
| `max_investment_size` | `numeric` |  |
| `investment_structure` | `jsonb` |  |
| `follow_on_investment` | `bool` |  |
| `investment_timeline` | `varchar` |  |
| `number_of_investments` | `int4` |  Nullable |
| `portfolio_companies` | `text` |  Nullable |
| `successful_exits` | `text` |  Nullable |
| `notable_achievements` | `text` |  Nullable |
| `what_you_look_for` | `text` |  |
| `deal_breakers` | `text` |  Nullable |
| `value_add` | `text` |  |
| `network_resources` | `text` |  Nullable |
| `primary_contact_email` | `varchar` |  |
| `phone_number` | `varchar` |  Nullable |
| `social_media` | `jsonb` |  Nullable |
| `preferred_contact_method` | `varchar` |  |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |
| `photo_url` | `varchar` |  Nullable |

## Table `messages`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `conversation_id` | `uuid` |  |
| `sender_id` | `uuid` |  |
| `receiver_id` | `uuid` |  |
| `text` | `text` |  |
| `attachment_url` | `varchar` |  Nullable |
| `read_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `notification_settings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Unique |
| `email_connection_requests` | `bool` |  |
| `email_messages` | `bool` |  |
| `email_profile_views` | `bool` |  |
| `email_weekly_digest` | `bool` |  |
| `notification_frequency` | `varchar` |  |
| `inapp_connection_requests` | `bool` |  |
| `inapp_messages` | `bool` |  |
| `inapp_profile_views` | `bool` |  |
| `inapp_system_updates` | `bool` |  |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |

## Table `password_reset_tokens`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `token` | `varchar` | Primary |
| `user_id` | `uuid` |  |
| `expires_at` | `timestamptz` |  |
| `used_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `privacy_settings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  Unique |
| `profile_visibility` | `varchar` |  |
| `connection_request_setting` | `bool` |  |
| `show_connections_list` | `bool` |  |
| `show_activity_status` | `bool` |  |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |

## Table `sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `refresh_token` | `varchar` |  Unique |
| `is_remembered` | `bool` |  |
| `expires_at` | `timestamptz` |  |
| `created_at` | `timestamptz` |  Nullable |
| `client_ip` | `varchar` |  Nullable |
| `device_info` | `varchar` |  Nullable |

## Table `startup_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `startup_profile_id` | `uuid` | Primary |
| `user_id` | `uuid` |  Unique |
| `company_name` | `varchar` |  |
| `founder_names` | `text` |  |
| `tagline` | `varchar` |  |
| `detailed_description` | `text` |  |
| `industry` | `varchar` |  |
| `founded_date` | `date` |  |
| `current_stage` | `startup_stage_enum` |  |
| `team_size` | `int4` |  |
| `key_team_members` | `text` |  Nullable |
| `team_photo_url` | `varchar` |  Nullable |
| `funding_stage` | `funding_stage_enum` |  |
| `amount_seeking` | `numeric` |  |
| `previous_funding` | `numeric` |  Nullable |
| `use_of_funds` | `text` |  |
| `revenue_status` | `revenue_status_enum` |  |
| `key_metrics` | `text` |  Nullable |
| `major_achievements` | `text` |  Nullable |
| `customer_testimonials` | `text` |  Nullable |
| `pitch_deck_url` | `varchar` |  Nullable |
| `business_plan_url` | `varchar` |  Nullable |
| `product_demo_url` | `varchar` |  Nullable |
| `primary_contact_name` | `varchar` |  |
| `contact_email` | `varchar` |  |
| `phone_number` | `varchar` |  Nullable |
| `social_media_links` | `jsonb` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |
| `logo_url` | `varchar` |  Nullable |
| `location_country` | `varchar` |  Nullable |
| `location_city` | `varchar` |  Nullable |
| `website_url` | `varchar` |  Nullable |

## Table `user_notification_reads`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `uuid` | Primary |
| `notification_key` | `text` | Primary |
| `read_at` | `timestamptz` |  |

## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `varchar` |  Unique |
| `password_hash` | `varchar` |  |
| `user_type` | `varchar` |  |
| `full_name` | `varchar` |  |
| `email_verified` | `bool` |  Nullable |
| `email_verification_token` | `varchar` |  Nullable |
| `created_at` | `timestamp` |  Nullable |
| `updated_at` | `timestamp` |  Nullable |
| `email_verification_token_expires` | `timestamptz` |  Nullable |
| `failed_login_attempts` | `int4` |  Nullable |
| `account_locked_until` | `timestamptz` |  Nullable |
| `deleted_at` | `timestamp` |  Nullable |
| `deletion_scheduled_at` | `timestamp` |  Nullable |

