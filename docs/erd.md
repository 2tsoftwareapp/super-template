# ERD

## Identity Domain

```mermaid
erDiagram
  organizations ||--o{ organization_members : has
  organizations ||--o{ roles : has
  organizations ||--o{ user_roles : scopes
  organizations ||--o{ projects : contains
  organizations ||--o{ notifications : scopes
  organizations ||--o{ invitations : scopes
  organizations ||--o{ audit_logs : scopes
  organizations ||--o{ files : contains
  organizations ||--o{ jobs : scopes
  organizations ||--o{ comments : scopes
  organizations ||--o{ activities : scopes
  users ||--o{ organization_members : belongs_to
  users ||--o{ auth_sessions : has
  users ||--o{ email_verification_tokens : owns
  users ||--o{ password_reset_tokens : owns
  users ||--o{ user_roles : assigned
  users ||--o{ user_two_factor_secrets : has
  users ||--o{ user_recovery_codes : has
  users ||--o{ mfa_challenges : has
  users ||--o{ external_identities : has
  users ||--o{ user_preferences : has
  users ||--o{ projects : owns
  users ||--o{ notifications : receives
  users ||--o{ notification_device_tokens : registers
  users ||--o{ notification_jobs : creates
  users ||--o{ invitations : sends
  users ||--o{ audit_logs : acts
  users ||--o{ comments : authors
  users ||--o{ activities : performs
  users ||--o{ files : uploads
  roles ||--o{ user_roles : linked
  roles ||--o{ role_permissions : grants
  permissions ||--o{ role_permissions : linked
  files ||--o{ file_versions : versioned
  files ||--o{ attachments : attached
  jobs ||--o{ job_attempts : has
  jobs ||--o{ job_events : emits
  jobs ||--o{ job_dependencies : depends_on

  organizations {
    uuid id PK
    text name
    text slug
    timestamptz deleted_at
    timestamptz created_at
    timestamptz updated_at
  }

  organization_members {
    uuid id PK
    uuid organization_id FK
    uuid user_id FK
    organization_member_role role
    timestamptz created_at
    timestamptz updated_at
  }

  users {
    uuid id PK
    text email
    text password_hash
    text display_name
    text avatar_url
    uuid avatar_file_id
    user_status status
    timestamptz email_verified_at
    timestamptz deleted_at
    timestamptz created_at
    timestamptz updated_at
  }

  auth_sessions {
    uuid id PK
    uuid user_id FK
    text refresh_token_hash
    timestamptz expires_at
    timestamptz revoked_at
    timestamptz last_used_at
    varchar ip_address
    text user_agent
    timestamptz created_at
    timestamptz updated_at
  }

  email_verification_tokens {
    uuid id PK
    uuid user_id FK
    text token_hash
    timestamptz expires_at
    timestamptz used_at
    timestamptz created_at
  }

  password_reset_tokens {
    uuid id PK
    uuid user_id FK
    text token_hash
    timestamptz expires_at
    timestamptz used_at
    timestamptz created_at
  }

  roles {
    uuid id PK
    uuid organization_id FK
    text name
    text description
    boolean is_system
    timestamptz created_at
    timestamptz updated_at
  }

  permissions {
    uuid id PK
    text name
    text description
    boolean is_system
    timestamptz created_at
    timestamptz updated_at
  }

  user_roles {
    uuid user_id FK
    uuid organization_id FK
    uuid role_id FK
    timestamptz assigned_at
  }

  role_permissions {
    uuid role_id FK
    uuid permission_id FK
    timestamptz assigned_at
  }

  user_two_factor_secrets {
    uuid user_id PK, FK
    text secret_ciphertext
    text secret_iv
    text secret_auth_tag
    boolean enabled
    timestamptz confirmed_at
    timestamptz created_at
    timestamptz updated_at
  }

  user_recovery_codes {
    uuid id PK
    uuid user_id FK
    text code_hash
    timestamptz used_at
    timestamptz created_at
  }

  mfa_challenges {
    uuid id PK
    uuid user_id FK
    text token_hash
    integer attempts
    timestamptz expires_at
    timestamptz consumed_at
    text ip_address
    text user_agent
    timestamptz created_at
  }

  external_identities {
    uuid id PK
    uuid user_id FK
    text provider
    text provider_subject
    text email
    timestamptz created_at
    timestamptz updated_at
  }

  sso_login_states {
    uuid id PK
    text provider
    text state_hash
    text nonce
    text code_verifier
    text redirect_uri
    timestamptz expires_at
    timestamptz consumed_at
    timestamptz created_at
  }

  sso_session_exchanges {
    uuid id PK
    text code_hash
    text access_token
    text refresh_token
    text organization_id
    timestamptz expires_at
    timestamptz consumed_at
    timestamptz created_at
  }

  user_preferences {
    uuid user_id PK, FK
    text theme
    text language
    text timezone
    jsonb notification_preferences
    jsonb email_preferences
    timestamptz created_at
    timestamptz updated_at
  }
```

## Platform Domain

```mermaid
erDiagram
  organizations ||--o{ audit_logs : scopes
  organizations ||--o{ files : contains
  organizations ||--o{ file_versions : scopes
  organizations ||--o{ attachments : scopes
  organizations ||--o{ jobs : scopes
  organizations ||--o{ job_attempts : scopes
  organizations ||--o{ job_events : scopes
  organizations ||--o{ job_dependencies : scopes
  organizations ||--o{ file_batch_operations : scopes
  users ||--o{ audit_logs : acts
  users ||--o{ files : uploads
  users ||--o{ file_versions : creates
  users ||--o{ file_batch_operations : operates
  users ||--o{ attachments : attaches
  users ||--o{ jobs : creates
  users ||--o{ application_settings : updates
  files ||--o{ file_versions : versioned
  files ||--o{ attachments : attached
  files ||--o{ import_jobs : imported
  files ||--o{ export_jobs : exported
  jobs ||--o{ job_attempts : has
  jobs ||--o{ job_events : emits
  jobs ||--o{ job_dependencies : depends_on

  audit_logs {
    uuid id PK
    uuid organization_id FK
    uuid actor_id FK
    text action
    text entity_type
    uuid entity_id
    jsonb metadata
    varchar ip_address
    text user_agent
    text request_id
    timestamptz created_at
  }

  files {
    uuid id PK
    uuid organization_id FK
    text storage_key
    text original_name
    text mime_type
    integer size_bytes
    text checksum
    integer latest_version
    uuid uploaded_by_id FK
    timestamptz deleted_at
    timestamptz created_at
    timestamptz updated_at
  }

  file_versions {
    uuid id PK
    uuid file_id FK
    uuid organization_id FK
    integer version_number
    text storage_key
    text mime_type
    integer size_bytes
    text checksum
    uuid created_by_id FK
    timestamptz created_at
  }

  file_batch_operations {
    uuid id PK
    uuid organization_id FK
    uuid actor_id FK
    text operation
    text idempotency_key
    jsonb results
    timestamptz created_at
  }

  attachments {
    uuid id PK
    uuid organization_id FK
    uuid file_id FK
    text entity_type
    uuid entity_id
    text label
    uuid created_by_id FK
    timestamptz deleted_at
    timestamptz created_at
    timestamptz updated_at
  }

  jobs {
    uuid id PK
    uuid organization_id FK
    text type
    jsonb payload
    job_status status
    timestamptz scheduled_at
    integer priority
    integer attempts
    integer max_attempts
    timestamptz started_at
    timestamptz completed_at
    timestamptz cancelled_at
    text error_message
    uuid created_by_id FK
    text idempotency_key
    timestamptz created_at
    timestamptz updated_at
  }

  job_attempts {
    uuid id PK
    uuid job_id FK
    uuid organization_id FK
    integer attempt_number
    text status
    timestamptz started_at
    timestamptz finished_at
    integer duration_ms
    text error_message
  }

  job_events {
    uuid id PK
    uuid job_id FK
    uuid organization_id FK
    uuid attempt_id FK
    text type
    text message
    jsonb metadata
    timestamptz created_at
  }

  job_dependencies {
    uuid id PK
    uuid job_id FK
    uuid depends_on_job_id FK
    uuid organization_id FK
    timestamptz created_at
  }

  import_jobs {
    uuid id PK
    uuid organization_id FK
    text type
    uuid file_id FK
    import_export_job_status status
    integer row_count
    integer success_count
    integer error_count
    jsonb errors
    uuid created_by_id FK
    timestamptz confirmed_at
    timestamptz completed_at
    text idempotency_key
    timestamptz created_at
    timestamptz updated_at
  }

  export_jobs {
    uuid id PK
    uuid organization_id FK
    text type
    import_export_job_status status
    uuid file_id FK
    jsonb filters
    uuid created_by_id FK
    timestamptz completed_at
    text idempotency_key
    timestamptz created_at
    timestamptz updated_at
  }

  mail_deliveries {
    uuid id PK
    text template_key
    text recipient
    text subject
    mail_delivery_status status
    text error_message
    jsonb metadata
    timestamptz sent_at
    timestamptz created_at
  }

  application_settings {
    text key PK
    jsonb value
    uuid updated_by_id FK
    timestamptz created_at
    timestamptz updated_at
  }
```

## Workspace Domain

```mermaid
erDiagram
  organizations ||--o{ projects : contains
  organizations ||--o{ notifications : scopes
  organizations ||--o{ notification_jobs : scopes
  organizations ||--o{ invitations : scopes
  organizations ||--o{ comments : scopes
  organizations ||--o{ activities : scopes
  users ||--o{ projects : owns
  users ||--o{ notifications : receives
  users ||--o{ notification_device_tokens : registers
  users ||--o{ invitation_sender : as_sender
  users ||--o{ invitation_acceptor : as_acceptor
  users ||--o{ comments : authors
  users ||--o{ activities : performs

  projects {
    uuid id PK
    uuid organization_id FK
    text name
    text description
    project_status status
    uuid owner_id FK
    uuid created_by_id FK
    uuid updated_by_id FK
    timestamptz deleted_at
    timestamptz created_at
    timestamptz updated_at
  }

  notifications {
    uuid id PK
    uuid organization_id FK
    uuid user_id FK
    text type
    text title
    text body
    jsonb data
    timestamptz read_at
    timestamptz created_at
  }

  notification_device_tokens {
    uuid id PK
    uuid user_id FK
    text token
    notification_device_platform platform
    timestamptz last_used_at
    timestamptz created_at
    timestamptz updated_at
  }

  notification_jobs {
    uuid id PK
    uuid organization_id FK
    uuid actor_id FK
    notification_audience audience
    uuid target_user_id FK
    jsonb user_ids
    text type
    text title
    text body
    jsonb data
    timestamptz scheduled_at
    notification_job_status status
    integer recipient_count
    timestamptz processed_at
    text error_message
    text idempotency_key
    timestamptz created_at
    timestamptz updated_at
  }

  invitations {
    uuid id PK
    uuid organization_id FK
    text email
    text token_hash
    text entity_type
    uuid entity_id
    text role
    uuid invited_by_id FK
    invitation_status status
    timestamptz expires_at
    timestamptz accepted_at
    uuid accepted_by_id FK
    timestamptz created_at
    timestamptz updated_at
  }

  comments {
    uuid id PK
    uuid organization_id FK
    text entity_type
    uuid entity_id
    uuid parent_id
    uuid author_id FK
    text content
    timestamptz deleted_at
    timestamptz created_at
    timestamptz updated_at
  }

  activities {
    uuid id PK
    uuid organization_id FK
    text summary
    text entity_type
    uuid entity_id
    uuid actor_id FK
    activity_visibility visibility
    jsonb metadata
    timestamptz created_at
  }
```

## Counts

- **37 tables** across 3 domains (Identity: 17, Platform: 13, Workspace: 7)
- **2 PostgreSQL enums** in identity: `user_status`, `organization_member_role`
- **3 enums** in platform: `mail_delivery_status`, `job_status`, `import_export_job_status`
- **5 enums** in workspace: `project_status`, `notification_device_platform`, `notification_audience`, `notification_job_status`, `invitation_status`, `activity_visibility`
- Tenancy is centered on `organizations` — most data tables carry a scoping `organization_id` FK
