ALTER TABLE "dnotes_files" ALTER COLUMN "icon_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "dnotes_files" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dnotes_files" ALTER COLUMN "folder_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dnotes_folders" ALTER COLUMN "icon_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "dnotes_folders" ALTER COLUMN "workspace_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dnotes_folders" DROP COLUMN "updated_at";