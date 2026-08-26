-- Naming convention: apply category prefixes to every physical table name.
--   m_ = master (reference/entity)      t_ = transaction (business events)
--   w_ = work/queue (jobs, outboxes)    l_ = log (audit/activity)
--   r_ = relation (junction / mapping)
-- Only the physical SQL table name changes; Drizzle symbols, columns, indexes,
-- RLS policies, and foreign keys are unaffected (they follow the table by OID).
-- See docs/architecture/NAMING_CONVENTIONS.md.

-- master --------------------------------------------------------------------
ALTER TABLE users RENAME TO m_users;
--> statement-breakpoint
ALTER TABLE organizations RENAME TO m_organizations;
--> statement-breakpoint
ALTER TABLE roles RENAME TO m_roles;
--> statement-breakpoint
ALTER TABLE permissions RENAME TO m_permissions;
--> statement-breakpoint
ALTER TABLE files RENAME TO m_files;
--> statement-breakpoint
ALTER TABLE user_preferences RENAME TO m_user_preferences;
--> statement-breakpoint
ALTER TABLE user_two_factor_secrets RENAME TO m_user_two_factor_secrets;
--> statement-breakpoint
ALTER TABLE notification_device_tokens RENAME TO m_notification_device_tokens;
--> statement-breakpoint
ALTER TABLE application_settings RENAME TO m_application_settings;
--> statement-breakpoint

-- transaction ---------------------------------------------------------------
ALTER TABLE auth_sessions RENAME TO t_auth_sessions;
--> statement-breakpoint
ALTER TABLE email_verification_tokens RENAME TO t_email_verification_tokens;
--> statement-breakpoint
ALTER TABLE password_reset_tokens RENAME TO t_password_reset_tokens;
--> statement-breakpoint
ALTER TABLE mfa_challenges RENAME TO t_mfa_challenges;
--> statement-breakpoint
ALTER TABLE user_recovery_codes RENAME TO t_user_recovery_codes;
--> statement-breakpoint
ALTER TABLE sso_login_states RENAME TO t_sso_login_states;
--> statement-breakpoint
ALTER TABLE sso_session_exchanges RENAME TO t_sso_session_exchanges;
--> statement-breakpoint
ALTER TABLE mail_deliveries RENAME TO t_mail_deliveries;
--> statement-breakpoint
ALTER TABLE notifications RENAME TO t_notifications;
--> statement-breakpoint
ALTER TABLE notification_deliveries RENAME TO t_notification_deliveries;
--> statement-breakpoint
ALTER TABLE import_jobs RENAME TO t_import_jobs;
--> statement-breakpoint
ALTER TABLE export_jobs RENAME TO t_export_jobs;
--> statement-breakpoint
ALTER TABLE file_versions RENAME TO t_file_versions;
--> statement-breakpoint
ALTER TABLE file_batch_operations RENAME TO t_file_batch_operations;
--> statement-breakpoint
ALTER TABLE storage_objects RENAME TO t_storage_objects;
--> statement-breakpoint

-- work / queue --------------------------------------------------------------
ALTER TABLE jobs RENAME TO w_jobs;
--> statement-breakpoint
ALTER TABLE job_attempts RENAME TO w_job_attempts;
--> statement-breakpoint
ALTER TABLE job_events RENAME TO w_job_events;
--> statement-breakpoint
ALTER TABLE notification_jobs RENAME TO w_notification_jobs;
--> statement-breakpoint
ALTER TABLE outbox_messages RENAME TO w_outbox_messages;
--> statement-breakpoint
ALTER TABLE storage_delete_outbox RENAME TO w_storage_delete_outbox;
--> statement-breakpoint

-- log -----------------------------------------------------------------------
ALTER TABLE audit_logs RENAME TO l_audit_logs;
--> statement-breakpoint
ALTER TABLE activities RENAME TO l_activities;
--> statement-breakpoint

-- relation / junction -------------------------------------------------------
ALTER TABLE user_roles RENAME TO r_user_roles;
--> statement-breakpoint
ALTER TABLE role_permissions RENAME TO r_role_permissions;
--> statement-breakpoint
ALTER TABLE organization_members RENAME TO r_organization_members;
--> statement-breakpoint
ALTER TABLE external_identities RENAME TO r_external_identities;
--> statement-breakpoint
ALTER TABLE attachments RENAME TO r_attachments;
--> statement-breakpoint
ALTER TABLE job_dependencies RENAME TO r_job_dependencies;
--> statement-breakpoint

-- Rebuild the only persistent plpgsql function whose body embeds a renamed
-- table name (roles -> m_roles). The trigger attachment on r_user_roles is
-- OID-based and survives the rename; only the function body needs updating.
CREATE OR REPLACE FUNCTION check_user_role_scope()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  role_org_id uuid;
BEGIN
  SELECT r.organization_id INTO role_org_id
  FROM m_roles r
  WHERE r.id = NEW.role_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'referenced role % does not exist', NEW.role_id
      USING ERRCODE = '23503';
  END IF;

  IF NEW.organization_id IS DISTINCT FROM role_org_id THEN
    RAISE EXCEPTION 'user_roles.organization_id must match roles.organization_id (expected %, got %)',
      role_org_id, NEW.organization_id
      USING ERRCODE = '23503';
  END IF;

  RETURN NEW;
END;
$$;
